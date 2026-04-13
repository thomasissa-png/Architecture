/**
 * POST /api/pro/projects/:id/rooms/:roomId/iterate — Itérer sur un visuel généré
 *
 * Rendu : SSR (force-dynamic) — appel IA.
 *
 * Auth + ownership obligatoires.
 * Prend un commentaire texte, enrichit via GPT-4.1-mini,
 * génère un nouveau visuel en mode adjust (édition chirurgicale)
 * ou restyle (re-pass 2 depuis surfaces vides).
 * Met à jour visual_output_path avec le nouveau résultat.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import {
  requireProjectOwnership,
  isErrorResponse,
  checkRateLimit,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables, getRoom, updateRoom } from "@/lib/marchand/db";
import { withStorageRetry } from "@/lib/db";
import {
  classifyIterationIntent,
  preprocessIterationComment,
} from "@/lib/custom-prompt";
import {
  buildAdjustResponsesPrompt,
  buildIterationFurnitureResponsesPrompt,
} from "@/lib/iteration-prompt";
import {
  getOutputSize,
  tryOpenAIResponsesWithPrompt,
} from "@/lib/generation-pipeline";
import { getStyleById } from "@/lib/style-resolver";

export const dynamic = "force-dynamic";

const IterateBodySchema = z.object({
  comment: z.string().min(1).max(500),
});

// ─── POST handler ───────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  const { id: projectId, roomId } = params;

  // ─── Auth + ownership ──────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  await ensureProTables();

  // ─── Rate limit: 1 iteration per room at a time ────────────────
  if (!checkRateLimit("iterate", roomId, 1, 120_000)) {
    return NextResponse.json(
      { error: "ALREADY_ITERATING", message: "Une itération est déjà en cours pour cette pièce." },
      { status: 409 }
    );
  }

  try {
    // ─── Validate body ───────────────────────────────────────────
    const rawBody = await request.json();
    const parseResult = IterateBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Commentaire invalide.", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { comment } = parseResult.data;

    // ─── Load room ───────────────────────────────────────────────
    const room = await getRoom(roomId);
    if (!room || room.project_id !== projectId) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Pièce introuvable." },
        { status: 404 }
      );
    }

    if (room.generation_status !== "done") {
      return NextResponse.json(
        { error: "NOT_READY", message: "La pièce doit être générée avant de pouvoir itérer." },
        { status: 422 }
      );
    }

    if (!room.visual_output_path) {
      return NextResponse.json(
        { error: "NO_VISUAL", message: "Aucun visuel disponible pour cette pièce." },
        { status: 422 }
      );
    }

    // ─── Mark room as iterating ──────────────────────────────────
    await updateRoom(roomId, {
      generation_status: "generating_pass2",
      generation_error: null,
    });

    // ─── Load output image from Object Storage ───────────────────
    let outputBuffer: Buffer = Buffer.alloc(0);
    await withStorageRetry(async (client) => {
      const result = await client.downloadAsBytes(room.visual_output_path!);
      if (result.value) {
        outputBuffer = Buffer.from(result.value as unknown as ArrayBuffer);
      }
    }, `downloadOutput(${room.visual_output_path})`);

    if (outputBuffer.length === 0) {
      await updateRoom(roomId, { generation_status: "done" });
      return NextResponse.json(
        { error: "IMAGE_NOT_FOUND", message: "Image source introuvable." },
        { status: 404 }
      );
    }

    const imageBase64 = outputBuffer.toString("base64");

    // ─── Get image dimensions ────────────────────────────────────
    let imgWidth = 1536;
    let imgHeight = 1024;
    try {
      const meta = await sharp(outputBuffer).metadata();
      if (meta.width && meta.height) {
        imgWidth = meta.width;
        imgHeight = meta.height;
      }
    } catch { /* fallback to landscape */ }

    const outputSize = getOutputSize(imgWidth, imgHeight);

    // ─── Classify intent: adjust vs restyle ──────────────────────
    const intent = await classifyIterationIntent(comment.trim());

    // ─── Get style info for pre-processing ───────────────────────
    // Fetch lot's style_id from DB
    let styleId = "contemporary";
    let furniturePrompt = "";
    if (room.lot_id) {
      const { getPool } = await import("@/lib/db");
      const db = getPool();
      const lotResult = await db.query(
        `SELECT style_id, custom_style_text FROM pro_lots WHERE id = $1`,
        [room.lot_id]
      );
      if (lotResult.rows[0]) {
        styleId = lotResult.rows[0].style_id || "contemporary";
        const stylePrompts = getStyleById(styleId, false);
        furniturePrompt = stylePrompts?.furniturePrompt || lotResult.rows[0].custom_style_text || "";
      }
    }

    // ─── Pre-process comment via GPT-4.1-mini ────────────────────
    const preprocessResult = await preprocessIterationComment(
      comment.trim(),
      styleId,
      furniturePrompt
    );

    // ─── Build prompt ────────────────────────────────────────────
    let prompt: string;

    if (intent === "adjust") {
      prompt = buildAdjustResponsesPrompt(
        comment.trim(),
        preprocessResult.enrichedComment,
        {
          roomType: room.room_type,
          allowWallMounted: preprocessResult.allowWallMounted,
        }
      );
    } else {
      // Restyle: load pass1 (surfaces) as source instead
      let pass1Base64: string | null = null;
      if (room.visual_pass1_path) {
        try {
          let pass1Buffer: Buffer = Buffer.alloc(0);
          await withStorageRetry(async (client) => {
            const result = await client.downloadAsBytes(room.visual_pass1_path!);
            if (result.value) {
              pass1Buffer = Buffer.from(result.value as unknown as ArrayBuffer);
            }
          }, `downloadPass1(${room.visual_pass1_path})`);
          if (pass1Buffer.length > 0) {
            pass1Base64 = pass1Buffer.toString("base64");
          }
        } catch { /* fallback to output image */ }
      }

      prompt = buildIterationFurnitureResponsesPrompt(
        furniturePrompt,
        [preprocessResult.enrichedComment],
        {
          width: imgWidth,
          height: imgHeight,
          roomType: room.room_type,
          allowWallMounted: preprocessResult.allowWallMounted,
        }
      );

      // Use pass1 as source for restyle (re-furnish from empty)
      if (pass1Base64) {
        return await generateAndSave(
          pass1Base64, prompt, outputSize.openai,
          projectId, room.lot_id, roomId, room.visual_output_path!
        );
      }
    }

    // ─── Generate (adjust mode or restyle fallback) ──────────────
    return await generateAndSave(
      imageBase64, prompt, outputSize.openai,
      projectId, room.lot_id, roomId, room.visual_output_path!
    );

  } catch (err) {
    console.error(`[POST iterate] Error:`, err);
    // Reset room status to done so user can retry
    try {
      await updateRoom(roomId, { generation_status: "done" });
    } catch { /* swallow */ }
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erreur lors de l'itération. Réessayez." },
      { status: 500 }
    );
  }
}

// ─── Helper: generate + save + update DB ────────────────────────────

async function generateAndSave(
  sourceBase64: string,
  prompt: string,
  openaiSize: string,
  projectId: string,
  lotId: string | null,
  roomId: string,
  currentOutputPath: string
): Promise<NextResponse> {
  try {
    const result = await tryOpenAIResponsesWithPrompt(sourceBase64, prompt, openaiSize);

    // Extract base64 from data URI
    let newBase64 = result.image;
    if (newBase64.startsWith("data:")) {
      newBase64 = newBase64.split(",")[1];
    }

    // Save new output to Object Storage (overwrite same key)
    const outputKey = currentOutputPath;
    const newBuffer = Buffer.from(newBase64, "base64");
    await withStorageRetry(
      (client) => client.uploadFromBytes(outputKey, newBuffer),
      `saveIteration(${outputKey})`
    );

    // Mark room as done
    await updateRoom(roomId, { generation_status: "done" });

    return NextResponse.json({
      success: true,
      visual_output_path: outputKey,
      model: result.model,
    });
  } catch (err) {
    console.error(`[iterate] Generation failed for room ${roomId}:`, err);
    // Reset to done so user can retry
    await updateRoom(roomId, { generation_status: "done" });
    return NextResponse.json(
      {
        error: "GENERATION_FAILED",
        message: err instanceof Error ? err.message : "Erreur lors de la génération.",
      },
      { status: 500 }
    );
  }
}
