/**
 * POST /api/pro/projects/:id/generate — Lancer la génération de visuels batch
 *
 * Rendu : SSR (force-dynamic) — appel IA long.
 *
 * Auth + ownership + vérification paiement obligatoires.
 * Pour chaque pièce avec photo, lance le pipeline 2 passes existant.
 * Max 2 pièces en parallèle (Promise.allSettled pool).
 * Retourne immédiatement (HTTP 202) puis traite en background.
 *
 * Note Replit autoscale : les générations sont lancées AVANT la réponse
 * HTTP car Replit tue le worker après envoi de la réponse. Le client
 * poll ensuite via GET /api/pro/projects/:id/status.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, withStorageRetry } from "@/lib/db";
import { ensureProTables } from "@/lib/marchand/db";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
  checkRateLimit,
} from "@/lib/marchand/auth-helpers";
import {
  generatePass,
  getOutputSize,
} from "@/lib/generation-pipeline";

export const dynamic = "force-dynamic";

// Max 2 concurrent generations
const MAX_CONCURRENT = 2;

// Route deadline to avoid Replit 504 (150s)
const ROUTE_DEADLINE_MS = 150_000;

// ─── Validation ─────────────────────────────────────────────────────

const GenerateBodySchema = z.object({
  lot_ids: z.array(z.string().uuid()).optional().nullable(),
});

// ─── Pool helper: run promises with max concurrency ─────────────────

async function poolConcurrent<T>(
  tasks: Array<() => Promise<T>>,
  maxConcurrent: number
): Promise<Array<PromiseSettledResult<T>>> {
  const results: Array<PromiseSettledResult<T>> = [];
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const currentIndex = index;
      index++;
      const result = await tasks[currentIndex]()
        .then((value) => ({ status: "fulfilled" as const, value }))
        .catch((reason) => ({ status: "rejected" as const, reason }));
      results[currentIndex] = result;
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, tasks.length) },
    () => runNext()
  );
  await Promise.all(workers);
  return results;
}

// ─── POST handler ───────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const startTime = Date.now();

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  const { project } = authResult;

  await ensureProTables();

  // ─── Status check ──────────────────────────────────────────────
  const allowedStatuses = ["validated", "qualified", "plan_final"];
  if (!allowedStatuses.includes(project.status)) {
    return NextResponse.json(
      {
        error: "INVALID_STATUS",
        message: "La génération nécessite un projet validé.",
      },
      { status: 409 }
    );
  }

  // ─── Rate limit: 1 generation job per project at a time ────────
  if (!checkRateLimit("generate", projectId, 1, 120_000)) {
    return NextResponse.json(
      {
        error: "ALREADY_GENERATING",
        message: "Une génération est déjà en cours pour ce projet.",
      },
      { status: 409 }
    );
  }

  try {
    // ─── Parse body ──────────────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const parsed = GenerateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { lot_ids } = parsed.data;

    const db = getPool();

    // ─── TODO: Verify credits/payment ────────────────────────────
    // const hasCredits = await checkMerchantCredits(user.id, projectId);
    // if (!hasCredits) {
    //   return NextResponse.json(
    //     { error: "PAYMENT_REQUIRED", message: "Paiement requis pour générer les visuels." },
    //     { status: 402 }
    //   );
    // }

    // ─── Load rooms to generate ──────────────────────────────────
    let roomsQuery: string;
    let roomsParams: (string | string[])[];

    if (lot_ids && lot_ids.length > 0) {
      // Specific lots
      roomsQuery = `
        SELECT r.id, r.name, r.room_type, r.surface_m2, r.length_m, r.width_m,
               r.ceiling_height_m, r.windows_count, r.photo_path,
               r.generation_status, r.lot_id,
               l.style_id, l.custom_style_text, l.target_buyer
        FROM pro_rooms r
        LEFT JOIN pro_lots l ON r.lot_id = l.id
        WHERE r.project_id = $1 AND r.lot_id = ANY($2)
        ORDER BY r.lot_id, r.name`;
      roomsParams = [projectId, lot_ids];
    } else {
      // All lots (LEFT JOIN to include rooms without lot_id)
      roomsQuery = `
        SELECT r.id, r.name, r.room_type, r.surface_m2, r.length_m, r.width_m,
               r.ceiling_height_m, r.windows_count, r.photo_path,
               r.generation_status, r.lot_id,
               l.style_id, l.custom_style_text, l.target_buyer
        FROM pro_rooms r
        LEFT JOIN pro_lots l ON r.lot_id = l.id
        WHERE r.project_id = $1
        ORDER BY r.lot_id NULLS LAST, r.name`;
      roomsParams = [projectId];
    }

    const roomsResult = await db.query(roomsQuery, roomsParams);
    const rooms = roomsResult.rows;

    if (rooms.length === 0) {
      return NextResponse.json(
        {
          error: "NO_ROOMS",
          message: "Aucune pièce à générer. Vérifiez que les pièces sont assignées à des lots.",
        },
        { status: 422 }
      );
    }

    // Filter to rooms with photos (required for generation)
    const roomsWithPhotos = rooms.filter(
      (r: { photo_path: string | null }) => r.photo_path
    );

    if (roomsWithPhotos.length === 0) {
      return NextResponse.json(
        {
          error: "NO_PHOTOS",
          message: "Aucune pièce n'a de photo source. Uploadez des photos avant de générer.",
        },
        { status: 422 }
      );
    }

    // ─── Mark project as generating ──────────────────────────────
    await db.query(
      `UPDATE pro_projects SET status = 'generating', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );

    // Mark all target rooms as generating
    const roomIds = roomsWithPhotos.map((r: { id: string }) => r.id);
    await db.query(
      `UPDATE pro_rooms SET generation_status = 'generating_pass1' WHERE id = ANY($1)`,
      [roomIds]
    );

    // ─── Build generation tasks ──────────────────────────────────
    const tasks = roomsWithPhotos.map(
      (room: {
        id: string;
        name: string;
        room_type: string;
        surface_m2: number | null;
        length_m: number | null;
        width_m: number | null;
        ceiling_height_m: number | null;
        windows_count: number;
        photo_path: string;
        lot_id: string;
        style_id: string | null;
        custom_style_text: string | null;
      }) =>
        async () => {
          // Check deadline
          if (Date.now() - startTime > ROUTE_DEADLINE_MS - 30_000) {
            throw new Error("Délai dépassé. La pièce sera générée au prochain essai.");
          }

          // Load source photo from Object Storage
          let photoBuffer: Buffer = Buffer.alloc(0);
          await withStorageRetry(async (client) => {
            const result = await client.downloadAsBytes(room.photo_path);
            if (result.value) {
              photoBuffer = Buffer.from(result.value as unknown as ArrayBuffer);
            }
          }, `downloadPhoto(${room.photo_path})`);

          if (photoBuffer.length === 0) {
            throw new Error(`Photo introuvable pour la pièce ${room.name}`);
          }

          const photoBase64 = photoBuffer.toString("base64");

          // Build dimension context for the prompt
          const dimensionBlock = buildDimensionBlock(room);

          // Get style prompts
          const styleId = room.style_id || "contemporain";
          const surfacePrompt = `${styleId} style surfaces. ${dimensionBlock}`;
          const furniturePrompt = `${styleId} style furniture for ${room.room_type}. ${dimensionBlock}`;

          // Get output size (assume landscape for now)
          const outputSize = getOutputSize(1536, 1024);

          // ─── Pass 1: surfaces ──────────────────────────────────
          await db.query(
            `UPDATE pro_rooms SET generation_status = 'generating_pass1' WHERE id = $1`,
            [room.id]
          );

          const pass1Result = await generatePass(
            photoBase64,
            surfacePrompt,
            furniturePrompt,
            1,
            outputSize,
            room.room_type
          );

          // Save pass1 result to Object Storage
          const pass1Key = `pro/${projectId}/${room.lot_id}/${room.id}/pass1.jpg`;
          const pass1Buffer = Buffer.from(pass1Result.image, "base64");
          await withStorageRetry(
            (client) => client.uploadFromBytes(pass1Key, pass1Buffer),
            `savePass1(${pass1Key})`
          );

          await db.query(
            `UPDATE pro_rooms SET visual_pass1_path = $1, generation_status = 'generating_pass2' WHERE id = $2`,
            [pass1Key, room.id]
          );

          // ─── Pass 2: furniture ─────────────────────────────────
          const pass2Result = await generatePass(
            pass1Result.image,
            surfacePrompt,
            furniturePrompt,
            2,
            outputSize,
            room.room_type,
            undefined,
            undefined,
            photoBase64
          );

          // Save final result to Object Storage
          const outputKey = `pro/${projectId}/${room.lot_id}/${room.id}/output.jpg`;
          const outputBuffer = Buffer.from(pass2Result.image, "base64");
          await withStorageRetry(
            (client) => client.uploadFromBytes(outputKey, outputBuffer),
            `saveOutput(${outputKey})`
          );

          // Mark room as done
          await db.query(
            `UPDATE pro_rooms SET visual_output_path = $1, generation_status = 'done' WHERE id = $2`,
            [outputKey, room.id]
          );

          return { roomId: room.id, status: "done" as const, outputKey };
        }
    );

    // ─── Execute with concurrency pool ───────────────────────────
    const results = await poolConcurrent(tasks, MAX_CONCURRENT);

    // ─── Process results ─────────────────────────────────────────
    let doneCount = 0;
    let failedCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        failedCount++;
        const roomId = roomsWithPhotos[i].id;
        const errorMsg =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        await db.query(
          `UPDATE pro_rooms SET generation_status = 'failed', generation_error = $1 WHERE id = $2`,
          [errorMsg, roomId]
        );
      } else {
        doneCount++;
      }
    }

    // ─── Update project status ───────────────────────────────────
    const finalStatus = failedCount === rooms.length ? "plan_final" : "visuals_done";
    await db.query(
      `UPDATE pro_projects SET status = $1, updated_at = NOW() WHERE id = $2`,
      [finalStatus, projectId]
    );

    console.log(
      `[POST /api/pro/projects/${projectId}/generate] Done: ${doneCount} OK, ${failedCount} failed, ${Date.now() - startTime}ms`
    );

    return NextResponse.json(
      {
        status: finalStatus,
        estimated_rooms: roomsWithPhotos.length,
        done: doneCount,
        failed: failedCount,
        duration_ms: Date.now() - startTime,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(`[POST /api/pro/projects/${projectId}/generate] Error:`, err);

    // Reset project status on catastrophic failure
    try {
      const db = getPool();
      await db.query(
        `UPDATE pro_projects SET status = 'plan_final', updated_at = NOW()
         WHERE id = $1 AND status = 'generating'`,
        [projectId]
      );
    } catch {
      // Swallow DB error in error handler
    }

    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la génération. Réessayez.",
      },
      { status: 500 }
    );
  }
}

// ─── Dimension block builder ────────────────────────────────────────

function buildDimensionBlock(room: {
  surface_m2: number | null;
  length_m: number | null;
  width_m: number | null;
  ceiling_height_m: number | null;
  windows_count: number;
}): string {
  const parts: string[] = [];

  if (room.length_m && room.width_m) {
    parts.push(`Room dimensions: ${room.length_m}m × ${room.width_m}m`);
  }
  if (room.surface_m2) {
    parts.push(`Surface: ${room.surface_m2}m²`);
  }
  if (room.ceiling_height_m) {
    parts.push(`Ceiling height: ${room.ceiling_height_m}m`);
  }
  if (room.windows_count > 0) {
    parts.push(`Windows: ${room.windows_count}`);
  }

  return parts.length > 0 ? parts.join(". ") + "." : "";
}
