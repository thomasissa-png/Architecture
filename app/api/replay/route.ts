import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTable, getImage, logGenerationReturningId } from "@/lib/db";
import { compareImages } from "@/lib/image-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — pipeline 2 passes can be slow

/**
 * POST /api/replay — Replay a generation with current prompts on the same input image.
 *
 * Body: {
 *   sourceGenerationId: number,
 *   replayPass?: 1 | 2 | "both",    // default "both"
 *   surfacePrompt?: string,          // override (else reuse source)
 *   furniturePrompt?: string,        // override (else reuse source)
 *   replayLabel?: string,            // tag for grouping
 * }
 */
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      sourceGenerationId,
      replayPass = "both",
      surfacePrompt: overrideSurface,
      furniturePrompt: overrideFurniture,
      replayLabel,
    } = body;

    if (!sourceGenerationId) {
      return NextResponse.json({ error: "sourceGenerationId requis" }, { status: 400 });
    }

    await ensureTable();
    const pool = getPool();

    // 1. Load source generation from DB
    const srcResult = await pool.query(
      `SELECT * FROM generation_logs WHERE id = $1`,
      [sourceGenerationId]
    );
    if (srcResult.rows.length === 0) {
      return NextResponse.json({ error: `Generation #${sourceGenerationId} introuvable` }, { status: 404 });
    }
    const src = srcResult.rows[0];

    // 2. Load input image from Object Storage
    let inputBase64: string | null = null;
    let pass1Base64ForReplay: string | null = null;

    if (replayPass === 2 && src.pass1_image_path) {
      // For pass-2-only replay, load the pass1 image instead
      const pass1Bytes = await getImage(src.pass1_image_path);
      if (!pass1Bytes) {
        return NextResponse.json({ error: "Image pass1 introuvable dans le storage" }, { status: 404 });
      }
      pass1Base64ForReplay = Buffer.from(pass1Bytes).toString("base64");
    }

    if (replayPass !== 2) {
      // Need the original input for pass 1
      if (!src.input_image_path) {
        return NextResponse.json({ error: "Pas d'image input stockee pour cette generation" }, { status: 404 });
      }
      const inputBytes = await getImage(src.input_image_path);
      if (!inputBytes) {
        return NextResponse.json({ error: "Image input introuvable dans le storage" }, { status: 404 });
      }
      inputBase64 = Buffer.from(inputBytes).toString("base64");
    }

    // 3. Resolve prompts (override or reuse source)
    const surfacePrompt = overrideSurface || src.surface_prompt;
    const furniturePrompt = overrideFurniture || src.furniture_prompt;

    // 4. Call /api/generate via internal fetch
    const origin = request.nextUrl.origin;
    const imageToSend = replayPass === 2
      ? `data:image/jpeg;base64,${pass1Base64ForReplay}`
      : `data:image/jpeg;base64,${inputBase64}`;

    const generateBody: Record<string, unknown> = {
      image: imageToSend,
      surfacePrompt,
      furniturePrompt,
      styleId: src.style_id || "custom",
      withFurniture: replayPass === 1 ? false : (src.with_furniture ?? true),
      width: src.input_width || 0,
      height: src.input_height || 0,
      roomType: src.room_type || undefined,
      isOutdoor: src.is_outdoor || false,
      outdoorSubtype: src.outdoor_subtype || undefined,
    };

    // For pass-2-only, we send it as a full generation with withFurniture=true
    // but using the pass1 image as input. The generate endpoint will run pass1
    // (which will be a no-op style change on already-finished surfaces) + pass2.
    // This is simpler than trying to skip pass1 internally.

    const t0 = Date.now();
    const generateResponse = await fetch(`${origin}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward IP for rate limiting
        "x-forwarded-for": request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
      body: JSON.stringify(generateBody),
    });

    const t1 = Date.now();

    if (!generateResponse.ok) {
      const errData = await generateResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error || `Generation failed (${generateResponse.status})` },
        { status: generateResponse.status }
      );
    }

    const genData = await generateResponse.json();
    const outputBase64 = genData.image?.replace(/^data:image\/[\w+]+;base64,/, "") || "";

    // 5. Compute metrics (compare source output vs replay output)
    let metrics: { pixelDiffPct: number; colorShiftScore: number } | null = null;
    if (src.output_image_path && outputBase64) {
      try {
        const srcOutputBytes = await getImage(src.output_image_path);
        if (srcOutputBytes) {
          const srcOutputBase64 = Buffer.from(srcOutputBytes).toString("base64");
          metrics = await compareImages(srcOutputBase64, outputBase64);
        }
      } catch (e) {
        console.error("Metrics computation failed:", e);
      }
    }

    // 6. Log replay to DB
    const replayId = await logGenerationReturningId({
      ip: request.headers.get("x-forwarded-for") || "replay",
      styleId: src.style_id || "custom",
      surfacePrompt,
      furniturePrompt,
      withFurniture: generateBody.withFurniture as boolean,
      inputWidth: src.input_width,
      inputHeight: src.input_height,
      modelUsed: genData.model || "unknown",
      durationMs: t1 - t0,
      success: true,
      builtPromptPass1: `[REPLAY of #${sourceGenerationId}]`,
      inputBase64: inputBase64 || pass1Base64ForReplay || undefined,
      outputBase64,
      isReplay: true,
      replaySourceId: sourceGenerationId,
      replayLabel: replayLabel || undefined,
      pixelDiffPct: metrics?.pixelDiffPct ?? undefined,
      colorShiftScore: metrics?.colorShiftScore ?? undefined,
      roomType: src.room_type || undefined,
      isOutdoor: src.is_outdoor || undefined,
      outdoorSubtype: src.outdoor_subtype || undefined,
    });

    return NextResponse.json({
      image: genData.image,
      model: genData.model,
      replayId,
      sourceGenerationId,
      durationMs: t1 - t0,
      metrics,
      builtPromptPass1: genData.built_prompt_pass1 || null,
      builtPromptPass2: genData.built_prompt_pass2 || null,
    });
  } catch (error) {
    console.error("Replay error:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
