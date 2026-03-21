import { Pool } from "pg";
import sharp from "sharp";

// ─── Singleton Pool ──────────────────────────────────────────────────
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

// ─── Auto-create table on first use ──────────────────────────────────
let tableEnsured = false;

async function ensureTable(): Promise<void> {
  if (tableEnsured) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS generation_logs (
      id                SERIAL PRIMARY KEY,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip                VARCHAR(45),
      style_id          VARCHAR(50),
      surface_prompt    TEXT NOT NULL,
      furniture_prompt  TEXT NOT NULL,
      with_furniture    BOOLEAN NOT NULL DEFAULT TRUE,
      input_width       INT,
      input_height      INT,
      model_used        VARCHAR(200),
      pass1_model       VARCHAR(100),
      pass2_model       VARCHAR(100),
      duration_ms       INT,
      pass1_duration_ms INT,
      pass2_duration_ms INT,
      success           BOOLEAN NOT NULL DEFAULT TRUE,
      error_message     TEXT,
      input_thumbnail   TEXT,
      output_thumbnail  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON generation_logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gen_logs_style ON generation_logs (style_id);
  `);
  tableEnsured = true;
}

// ─── Thumbnail helper ────────────────────────────────────────────────
async function makeThumbnail(base64: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64, "base64");
    const thumb = await sharp(buffer).resize(200).jpeg({ quality: 60 }).toBuffer();
    return thumb.toString("base64");
  } catch {
    return null;
  }
}

// ─── Log a generation (fire-and-forget) ──────────────────────────────
export interface GenerationLogParams {
  ip: string;
  styleId: string;
  surfacePrompt: string;
  furniturePrompt: string;
  withFurniture: boolean;
  inputWidth?: number;
  inputHeight?: number;
  modelUsed?: string;
  pass1Model?: string;
  pass2Model?: string;
  durationMs?: number;
  pass1DurationMs?: number;
  pass2DurationMs?: number;
  success: boolean;
  errorMessage?: string;
  inputBase64?: string;
  outputBase64?: string;
}

export async function logGeneration(params: GenerationLogParams): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  await ensureTable();

  // Generate thumbnails in background (small, ~15KB each)
  const [inputThumb, outputThumb] = await Promise.all([
    params.inputBase64 ? makeThumbnail(params.inputBase64) : null,
    params.outputBase64 ? makeThumbnail(params.outputBase64) : null,
  ]);

  const db = getPool();
  await db.query(
    `INSERT INTO generation_logs (
      ip, style_id, surface_prompt, furniture_prompt, with_furniture,
      input_width, input_height, model_used, pass1_model, pass2_model,
      duration_ms, pass1_duration_ms, pass2_duration_ms,
      success, error_message, input_thumbnail, output_thumbnail
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      params.ip,
      params.styleId,
      params.surfacePrompt,
      params.furniturePrompt,
      params.withFurniture,
      params.inputWidth ?? null,
      params.inputHeight ?? null,
      params.modelUsed ?? null,
      params.pass1Model ?? null,
      params.pass2Model ?? null,
      params.durationMs ?? null,
      params.pass1DurationMs ?? null,
      params.pass2DurationMs ?? null,
      params.success,
      params.errorMessage ?? null,
      inputThumb,
      outputThumb,
    ]
  );
}
