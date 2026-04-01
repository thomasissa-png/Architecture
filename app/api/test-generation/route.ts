/**
 * Test autopilot endpoint — régénère des images depuis la base avec les prompts v34 + gpt-image-1.5.
 *
 * POST /api/test-generation
 * Headers: x-admin-password: <ADMIN_PASSWORD>
 * Body: { limit?: number, styleId?: string, outdoorOnly?: boolean, dryRun?: boolean }
 *
 * Protected by ADMIN_PASSWORD. Results logged to DB with is_replay=true.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTable, getImage, saveImage } from "@/lib/db";
import { runGenerationPipeline, PROMPT_VERSION } from "@/lib/generation-pipeline";
import { getStyleById } from "@/lib/style-resolver";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max for Vercel/Replit

interface SourceGeneration {
  id: number;
  style_id: string;
  input_image_path: string;
  input_width: number;
  input_height: number;
  room_type: string | null;
  is_outdoor: boolean;
  outdoor_subtype: string | null;
  surface_prompt: string;
  furniture_prompt: string;
  prompt_version: string;
}

export async function POST(request: NextRequest) {
  // Auth check
  const adminPwd = process.env.ADMIN_PASSWORD;
  const token = request.headers.get("x-admin-password") || "";
  if (adminPwd && token !== adminPwd) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(body.limit ?? 3, 10); // max 10 per call
  const styleFilter: string | undefined = body.styleId;
  const outdoorOnly: boolean = body.outdoorOnly ?? false;
  const dryRun: boolean = body.dryRun ?? false;

  await ensureTable();
  const pool = getPool();

  // Find source generations with input images
  const conditions = [
    "success = true",
    "input_image_path IS NOT NULL",
    "input_image_path != ''",
    "(is_iteration IS NULL OR is_iteration = false)",
    "(is_replay IS NULL OR is_replay = false)",
  ];
  if (styleFilter) conditions.push(`style_id = '${styleFilter.replace(/'/g, "''")}'`);
  if (outdoorOnly) conditions.push("is_outdoor = true");

  const where = conditions.join(" AND ");
  const query = `
    SELECT DISTINCT ON (style_id, COALESCE(room_type, ''), COALESCE(is_outdoor::text, 'false'))
      id, style_id, input_image_path, input_width, input_height,
      room_type, is_outdoor, outdoor_subtype, surface_prompt, furniture_prompt, prompt_version
    FROM generation_logs
    WHERE ${where}
    ORDER BY style_id, COALESCE(room_type, ''), COALESCE(is_outdoor::text, 'false'), created_at DESC
    LIMIT ${limit}
  `;

  const { rows } = await pool.query<SourceGeneration>(query);

  if (rows.length === 0) {
    return NextResponse.json({ message: "No source generations found with input images", count: 0 });
  }

  // Dry run: just list what we'd test
  const sources = rows.map((g) => ({
    id: g.id,
    style: g.is_outdoor ? `outdoor/${g.outdoor_subtype}` : g.style_id,
    roomType: g.room_type,
    dimensions: `${g.input_width}x${g.input_height}`,
    previousVersion: g.prompt_version,
  }));

  if (dryRun) {
    return NextResponse.json({ dryRun: true, count: sources.length, sources, promptVersion: PROMPT_VERSION });
  }

  // Run generations
  const results: {
    sourceId: number;
    style: string;
    success: boolean;
    durationMs?: number;
    outputKey?: string;
    pass1Key?: string;
    error?: string;
    newLogId?: number;
  }[] = [];

  for (const gen of rows) {
    const styleLabel = gen.is_outdoor ? `outdoor/${gen.outdoor_subtype}` : gen.style_id;

    try {
      // Load input image from Object Storage
      const imageData = await getImage(gen.input_image_path);
      if (!imageData) throw new Error(`Input image not found: ${gen.input_image_path}`);
      const inputBase64 = Buffer.from(imageData).toString("base64");

      // Resolve style prompts — use CURRENT v34 prompts, not old ones from DB
      const style = getStyleById(gen.style_id, gen.is_outdoor ?? false);
      const surfacePrompt = style?.surfacePrompt ?? gen.surface_prompt;
      const furniturePrompt = style?.furniturePrompt ?? gen.furniture_prompt;

      // Run 2-pass pipeline
      const result = await runGenerationPipeline({
        inputBase64,
        surfacePrompt,
        furniturePrompt,
        styleId: gen.style_id,
        roomType: gen.room_type,
        isOutdoor: gen.is_outdoor ?? false,
        outdoorSubtype: gen.outdoor_subtype,
        width: gen.input_width,
        height: gen.input_height,
      });

      // Save images to Object Storage
      const timestamp = Date.now();
      const prefix = `test_${timestamp}_${gen.style_id}`;
      const outputKey = await saveImage(result.outputBase64, `${prefix}_output`);
      const pass1Key = await saveImage(result.pass1Base64, `${prefix}_pass1`);

      // Log to DB
      const insertResult = await pool.query(`
        INSERT INTO generation_logs (
          ip, style_id, surface_prompt, furniture_prompt, with_furniture,
          input_width, input_height, model_used, pass1_model, pass2_model,
          duration_ms, pass1_duration_ms, pass2_duration_ms, success,
          built_prompt_pass1, built_prompt_pass2,
          input_image_path, pass1_image_path, output_image_path,
          room_type, is_outdoor, outdoor_subtype,
          is_replay, replay_source_id, replay_label, prompt_version
        ) VALUES (
          'test-api', $1, $2, $3, true,
          $4, $5, $6, $7, $8,
          $9, $10, $11, true,
          $12, $13,
          $14, $15, $16,
          $17, $18, $19,
          true, $20, $21, $22
        ) RETURNING id
      `, [
        gen.style_id,
        surfacePrompt,
        furniturePrompt,
        gen.input_width,
        gen.input_height,
        `OpenAI gpt-image-1.5 (2 passes)`,
        result.pass1Model,
        result.pass2Model,
        result.durationMs,
        result.pass1DurationMs,
        result.pass2DurationMs,
        result.builtPromptPass1,
        result.builtPromptPass2,
        gen.input_image_path,
        pass1Key,
        outputKey,
        gen.room_type,
        gen.is_outdoor ?? false,
        gen.outdoor_subtype,
        gen.id,
        `test-${PROMPT_VERSION}`,
        PROMPT_VERSION,
      ]);

      results.push({
        sourceId: gen.id,
        style: styleLabel,
        success: true,
        durationMs: result.durationMs,
        outputKey,
        pass1Key,
        newLogId: insertResult.rows[0]?.id,
      });

    } catch (err) {
      results.push({
        sourceId: gen.id,
        style: styleLabel,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const avgDurationMs = succeeded.length > 0
    ? Math.round(succeeded.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) / succeeded.length)
    : 0;

  return NextResponse.json({
    promptVersion: PROMPT_VERSION,
    model: "gpt-image-1.5",
    total: results.length,
    succeeded: succeeded.length,
    failed: failed.length,
    avgDurationMs,
    avgDurationSec: Math.round(avgDurationMs / 1000),
    results,
    viewAt: `/admin → filter replay_label = "test-${PROMPT_VERSION}"`,
  });
}
