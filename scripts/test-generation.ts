/**
 * Test autopilot — régénère des images depuis la base avec les prompts v34 + gpt-image-1.5.
 *
 * Usage:
 *   npx tsx scripts/test-generation.ts
 *   npx tsx scripts/test-generation.ts --limit 3
 *   npx tsx scripts/test-generation.ts --style scandinavian
 *   npx tsx scripts/test-generation.ts --outdoor
 *   npx tsx scripts/test-generation.ts --dry-run
 *
 * Requires: OPENAI_API_KEY, DATABASE_URL in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";
import { runGenerationPipeline, PROMPT_VERSION } from "../lib/generation-pipeline";
import { getStyleById } from "../lib/style-resolver";

// ─── CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg("limit") ?? "5", 10);
const STYLE_FILTER = getArg("style");
const OUTDOOR_ONLY = hasFlag("outdoor");
const DRY_RUN = hasFlag("dry-run");
const SKIP_ITERATIONS = !hasFlag("include-iterations");

// ─── DB ──────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface GenerationLog {
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

async function fetchSourceGenerations(): Promise<GenerationLog[]> {
  const conditions = [
    "success = true",
    "input_image_path IS NOT NULL",
    "input_image_path != ''",
  ];
  if (SKIP_ITERATIONS) conditions.push("(is_iteration IS NULL OR is_iteration = false)");
  if (STYLE_FILTER) conditions.push(`style_id = '${STYLE_FILTER}'`);
  if (OUTDOOR_ONLY) conditions.push("is_outdoor = true");

  const where = conditions.join(" AND ");
  const query = `
    SELECT DISTINCT ON (style_id, COALESCE(room_type, ''), COALESCE(is_outdoor::text, 'false'))
      id, style_id, input_image_path, input_width, input_height,
      room_type, is_outdoor, outdoor_subtype, surface_prompt, furniture_prompt, prompt_version
    FROM generation_logs
    WHERE ${where}
    ORDER BY style_id, COALESCE(room_type, ''), COALESCE(is_outdoor::text, 'false'), created_at DESC
    LIMIT ${LIMIT}
  `;

  const result = await pool.query(query);
  return result.rows;
}

// ─── Object Storage — read input images ──────────────────────────────
async function loadImageFromStorage(key: string): Promise<string> {
  // Dynamic import to handle Replit SDK
  const { Client } = await import("@replit/object-storage");
  const client = new Client();
  const { ok, value } = await client.downloadAsBytes(key);
  if (!ok || !value) throw new Error(`Failed to load image: ${key}`);
  return Buffer.from(value).toString("base64");
}

// ─── Save results to DB ─────────────────────────────────────────────
async function saveTestResult(
  sourceGen: GenerationLog,
  result: {
    outputBase64: string;
    pass1Base64: string;
    pass1Model: string;
    pass2Model: string | null;
    durationMs: number;
    pass1DurationMs: number;
    pass2DurationMs: number;
    builtPromptPass1: string;
    builtPromptPass2: string;
  }
) {
  // Save output image to Object Storage
  const { Client } = await import("@replit/object-storage");
  const client = new Client();
  const timestamp = Date.now();
  const outputKey = `logs/test_${timestamp}_${sourceGen.style_id}_output.jpg`;
  const pass1Key = `logs/test_${timestamp}_${sourceGen.style_id}_pass1.jpg`;

  const outputBuf = Buffer.from(result.outputBase64, "base64");
  const pass1Buf = Buffer.from(result.pass1Base64, "base64");

  await client.uploadFromBytes(outputKey, outputBuf);
  await client.uploadFromBytes(pass1Key, pass1Buf);

  // Log to DB
  await pool.query(`
    INSERT INTO generation_logs (
      ip, style_id, surface_prompt, furniture_prompt, with_furniture,
      input_width, input_height, model_used, pass1_model, pass2_model,
      duration_ms, pass1_duration_ms, pass2_duration_ms, success,
      built_prompt_pass1, built_prompt_pass2,
      input_image_path, pass1_image_path, output_image_path,
      room_type, is_outdoor, outdoor_subtype,
      is_replay, replay_source_id, replay_label, prompt_version
    ) VALUES (
      'test-script', $1, $2, $3, true,
      $4, $5, $6, $7, $8,
      $9, $10, $11, true,
      $12, $13,
      $14, $15, $16,
      $17, $18, $19,
      true, $20, $21, $22
    )
  `, [
    sourceGen.style_id,
    sourceGen.surface_prompt,
    sourceGen.furniture_prompt,
    sourceGen.input_width,
    sourceGen.input_height,
    `OpenAI gpt-image-1.5 (2 passes)`,
    result.pass1Model,
    result.pass2Model,
    result.durationMs,
    result.pass1DurationMs,
    result.pass2DurationMs,
    result.builtPromptPass1,
    result.builtPromptPass2,
    sourceGen.input_image_path, // reuse same input
    pass1Key,
    outputKey,
    sourceGen.room_type,
    sourceGen.is_outdoor ?? false,
    sourceGen.outdoor_subtype,
    sourceGen.id,
    `test-v34-${PROMPT_VERSION}`,
    PROMPT_VERSION,
  ]);

  return { outputKey, pass1Key };
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔬 Test autopilot — prompts ${PROMPT_VERSION} + gpt-image-1.5`);
  console.log(`   Limit: ${LIMIT} | Style: ${STYLE_FILTER ?? "all"} | Outdoor: ${OUTDOOR_ONLY} | Dry run: ${DRY_RUN}\n`);

  const generations = await fetchSourceGenerations();
  console.log(`Found ${generations.length} source generations to re-test.\n`);

  if (generations.length === 0) {
    console.log("No generations found with input images. Exiting.");
    process.exit(0);
  }

  // Show what we'll test
  for (const gen of generations) {
    const styleInfo = gen.is_outdoor ? `outdoor/${gen.outdoor_subtype}` : gen.style_id;
    const roomInfo = gen.room_type ? ` (${gen.room_type})` : "";
    console.log(`  #${gen.id} — ${styleInfo}${roomInfo} — ${gen.input_width}x${gen.input_height} — was ${gen.prompt_version}`);
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: stopping here. Remove flag to run generations.\n");
    process.exit(0);
  }

  console.log("\n--- Starting generations ---\n");

  const results: { id: number; style: string; duration: number; success: boolean; error?: string }[] = [];

  for (const gen of generations) {
    const styleLabel = gen.is_outdoor ? `outdoor/${gen.outdoor_subtype}` : gen.style_id;
    process.stdout.write(`#${gen.id} ${styleLabel}... `);

    try {
      // Load input image from Object Storage
      const inputBase64 = await loadImageFromStorage(gen.input_image_path);

      // Resolve style prompts (use current v34 prompts, not the old ones from DB)
      const style = getStyleById(gen.style_id, gen.is_outdoor ?? false);
      const surfacePrompt = style?.surfacePrompt ?? gen.surface_prompt;
      const furniturePrompt = style?.furniturePrompt ?? gen.furniture_prompt;

      // Run pipeline
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

      // Save
      const { outputKey } = await saveTestResult(gen, result);

      const duration = Math.round(result.durationMs / 1000);
      console.log(`OK (${duration}s) → ${outputKey}`);
      results.push({ id: gen.id, style: styleLabel, duration: result.durationMs, success: true });

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`FAIL: ${msg}`);
      results.push({ id: gen.id, style: styleLabel, duration: 0, success: false, error: msg });
    }
  }

  // Summary
  console.log("\n--- Summary ---\n");
  const ok = results.filter(r => r.success);
  const fail = results.filter(r => !r.success);
  console.log(`  ${ok.length}/${results.length} succeeded`);
  if (ok.length > 0) {
    const avgDuration = Math.round(ok.reduce((sum, r) => sum + r.duration, 0) / ok.length / 1000);
    console.log(`  Average duration: ${avgDuration}s`);
  }
  if (fail.length > 0) {
    console.log(`\n  Failed:`);
    for (const f of fail) {
      console.log(`    #${f.id} ${f.style}: ${f.error}`);
    }
  }

  console.log(`\n  Results logged to DB with replay_label="test-v34-${PROMPT_VERSION}"`);
  console.log(`  View at: /admin → filter by replay_label\n`);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
