/**
 * POST /api/pro/projects/:id/extract — Extraction IA du plan
 *
 * Rendu : SSR (force-dynamic) — appel IA coûteux.
 *
 * Auth + ownership obligatoires.
 * Charge le plan depuis Object Storage, appelle GPT-4.1 vision
 * pour extraire les pièces, sauvegarde en DB.
 * Rate limit : 3 extractions/projet (anti-boucle coûteuse).
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, withStorageRetry } from "@/lib/db";
import { ensureProTables } from "@/lib/marchand/db";
import {
  requireProjectOwnership,
  isErrorResponse,
  checkRateLimit,
} from "@/lib/marchand/auth-helpers";
import { extractMultiplePlans, PlanExtractionError } from "@/lib/marchand/plan-extractor";
import type { TypeBien } from "@/lib/marchand/schemas";
// TODO: import { suggestLots } from "@/lib/marchand/plan-extractor";

export const dynamic = "force-dynamic";

// ─── Room type inference from name_raw ──────────────────────────────

/**
 * Infer room_type from the AI-extracted name_raw (e.g. "Salon" → "salon").
 * Handles French room names with accents and common abbreviations.
 * Fallback to "autre" only if no pattern matches.
 */
function inferRoomType(nameRaw: string): string {
  const n = nameRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/salon|sejour|living|salle.*manger/.test(n)) return "salon";
  if (/cuisine|kitchen|kitchenette/.test(n)) return "cuisine";
  if (/chambre|bedroom/.test(n)) return "chambre";
  if (/salle.*bain|sdb|bathroom/.test(n)) return "sdb";
  if (/\bwc\b|toilet/.test(n)) return "wc";
  if (/bureau|office/.test(n)) return "bureau";
  if (/couloir|hall|entree|degagement|palier/.test(n)) return "couloir";
  if (/cave|cellier|rangement|buanderie/.test(n)) return "cave";
  return "autre";
}

// ─── POST handler ───────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  const { project } = authResult;

  await ensureProTables();

  // ─── Status check ──────────────────────────────────────────────
  if (project.status !== "plan_uploaded" && project.status !== "extraction_failed") {
    return NextResponse.json(
      {
        error: "INVALID_STATUS",
        message: "L'extraction n'est possible que sur un projet avec plan uploadé.",
      },
      { status: 409 }
    );
  }

  // ─── Rate limit: 3 extractions/projet ──────────────────────────
  if (!checkRateLimit("extract", projectId, 3, 3600_000)) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT",
        message: "Maximum 3 extractions par projet. Contactez le support si besoin.",
      },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  try {
    // ─── Load plan(s) from Object Storage ─────────────────────────
    if (!project.plan_file_path) {
      return NextResponse.json(
        { error: "PLAN_REQUIRED", message: "Aucun plan trouvé pour ce projet." },
        { status: 400 }
      );
    }

    // plan_file_path can be a single path or JSON array of paths (multi-file)
    let planPaths: string[];
    let planMimeTypes: string[];
    try {
      const parsed = JSON.parse(project.plan_file_path);
      if (Array.isArray(parsed)) {
        planPaths = parsed;
        // plan_mime_type is also a JSON array when multi-file
        const mimes = project.plan_mime_type ? JSON.parse(project.plan_mime_type) : [];
        planMimeTypes = Array.isArray(mimes)
          ? mimes
          : planPaths.map(() => project.plan_mime_type || "image/jpeg");
      } else {
        planPaths = [project.plan_file_path];
        planMimeTypes = [project.plan_mime_type || "image/jpeg"];
      }
    } catch {
      // Not JSON — single path string
      planPaths = [project.plan_file_path];
      planMimeTypes = [project.plan_mime_type || "image/jpeg"];
    }

    // Download all plans from Object Storage
    const planInputs: Array<{ base64: string; mimeType: string; floorIndex: number }> = [];

    for (let i = 0; i < planPaths.length; i++) {
      const path = planPaths[i];
      let planBuffer: Buffer = Buffer.alloc(0);
      await withStorageRetry(async (client) => {
        const result = await client.downloadAsBytes(path);
        if (result.value) {
          planBuffer = Buffer.from(result.value as unknown as ArrayBuffer);
        }
      }, `downloadPlan(${path})`);

      if (planBuffer.length === 0) {
        console.warn(`[extract] Plan file empty or unreadable: ${path}`);
        continue;
      }

      planInputs.push({
        base64: planBuffer.toString("base64"),
        mimeType: planMimeTypes[i] || "image/jpeg",
        floorIndex: i,
      });
    }

    if (planInputs.length === 0) {
      return NextResponse.json(
        {
          error: "PLAN_UNREADABLE",
          message: "Impossible de lire le(s) plan(s). Réuploadez-les au format JPG, PNG ou PDF.",
        },
        { status: 422 }
      );
    }

    // ─── Call extraction IA ───────────────────────────────────────
    const extractionResult = await extractMultiplePlans(
      planInputs,
      project.type_bien as TypeBien
    );

    if (extractionResult.rooms.length === 0) {
      // Mark project as extraction_failed
      const db = getPool();
      await db.query(
        `UPDATE pro_projects SET status = 'extraction_failed', updated_at = NOW() WHERE id = $1`,
        [projectId]
      );
      return NextResponse.json(
        {
          status: "extraction_failed",
          reason: "NO_ROOMS_DETECTED",
          message: "Aucune pièce détectée sur le plan. Vérifiez la qualité de l'image.",
        },
        { status: 422 }
      );
    }

    // ─── Save extraction data + rooms in DB ───────────────────────
    const db = getPool();

    // Archive raw extraction in project
    await db.query(
      `UPDATE pro_projects
       SET extraction_data = $1, status = 'extraction_done', updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(extractionResult), projectId]
    );

    // Insert rooms
    const insertedRooms: Array<{ id: string; name: string; room_type: string; surface_m2: number | null }> = [];

    for (const room of extractionResult.rooms) {
      const insertResult = await db.query(
        `INSERT INTO pro_rooms (
          project_id, name, room_type, surface_m2,
          length_m, width_m, ceiling_height_m,
          windows_count, doors_count, floor, shape,
          is_estimated, confidence, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, name, room_type, surface_m2`,
        [
          projectId,
          room.name_raw,
          inferRoomType(room.name_raw),
          room.surface_m2,
          room.dimensions?.length_m ?? null,
          room.dimensions?.width_m ?? null,
          room.ceiling_height_m,
          room.windows_count,
          room.doors_count,
          room.floor ?? 0,
          room.shape,
          room.surface_m2 !== null && room.dimensions === null, // is_estimated
          room.confidence,
          "ai_extraction",
        ]
      );
      const row = insertResult.rows[0];
      insertedRooms.push({
        id: row.id,
        name: row.name,
        room_type: row.room_type,
        surface_m2: row.surface_m2 !== null ? Number(row.surface_m2) : null,
      });
    }

    // ─── Auto-assign rooms to lot for non-immeuble projects ─────
    if (project.type_bien !== "immeuble") {
      const lotResult = await db.query(
        `SELECT id FROM pro_lots WHERE project_id = $1 LIMIT 1`,
        [projectId]
      );
      if (lotResult.rows.length > 0) {
        const lotId = lotResult.rows[0].id;
        const roomIds = insertedRooms.map((r) => r.id);
        if (roomIds.length > 0) {
          await db.query(
            `UPDATE pro_rooms SET lot_id = $1 WHERE id = ANY($2)`,
            [lotId, roomIds]
          );
        }
      }
    }

    // ─── Lot suggestions for immeuble with multiple floors ────────
    const lotSuggestions = undefined;

    if (
      project.type_bien === "immeuble" &&
      extractionResult.floors_count > 1
    ) {
      // TODO: Call suggestLots() when available
      // lotSuggestions = await suggestLots({
      //   rooms: extractionResult.rooms,
      //   floorsCount: extractionResult.floors_count,
      // });
      console.warn(
        `[POST /api/pro/projects/${projectId}/extract] suggestLots() not yet available.`
      );
    }

    console.log(
      `[POST /api/pro/projects/${projectId}/extract] Extracted ${insertedRooms.length} rooms`
    );

    return NextResponse.json({
      status: "extraction_done",
      rooms_count: insertedRooms.length,
      rooms: insertedRooms,
      lot_suggestions: lotSuggestions,
    });
  } catch (err) {
    console.error(`[POST /api/pro/projects/${projectId}/extract] Error:`, err);

    // Mark as failed
    try {
      const db = getPool();
      await db.query(
        `UPDATE pro_projects SET status = 'extraction_failed', updated_at = NOW() WHERE id = $1`,
        [projectId]
      );
    } catch {
      // Swallow DB error in error handler
    }

    // Provide specific error messages based on the error type
    let userMessage = "Erreur lors de l'extraction. Réessayez ou uploadez une image (JPG, PNG) du plan.";
    let reason: string = "API_ERROR";

    if (err instanceof PlanExtractionError) {
      reason = err.reason;
      switch (err.reason) {
        case "API_ERROR":
          userMessage = err.message; // Already user-friendly from plan-extractor
          break;
        case "PARSING_FAILED":
          userMessage = "L'IA n'a pas pu interpréter ce plan. Essayez avec une image plus nette ou un autre format.";
          break;
        case "PLAN_UNREADABLE":
          userMessage = "Le plan est illisible. Vérifiez la qualité du fichier et réessayez.";
          break;
        case "NO_ROOMS_DETECTED":
          userMessage = "Aucune pièce détectée. Vérifiez que le fichier contient bien un plan architectural.";
          break;
      }
    }

    return NextResponse.json(
      {
        status: "extraction_failed",
        reason,
        message: userMessage,
      },
      { status: 500 }
    );
  }
}
