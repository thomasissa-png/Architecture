import { Pool } from "pg";
import { Client as StorageClient } from "@replit/object-storage";

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
      built_prompt_pass1 TEXT,
      built_prompt_pass2 TEXT,
      input_image_path   TEXT,
      pass1_image_path   TEXT,
      output_image_path  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON generation_logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gen_logs_style ON generation_logs (style_id);
  `);
  tableEnsured = true;
}

// ─── Save image to Replit Object Storage (persistent across deploys) ─
let storageClient: StorageClient | null = null;

function getStorage(): StorageClient {
  if (!storageClient) {
    storageClient = new StorageClient();
  }
  return storageClient;
}

async function saveImage(base64: string, name: string): Promise<string> {
  const key = `logs/${name}.jpg`;
  const buffer = Buffer.from(base64, "base64");
  const storage = getStorage();
  const { ok, error } = await storage.uploadFromBytes(key, buffer);
  if (!ok) {
    console.error("Object Storage upload failed:", error);
    throw new Error(`Failed to upload ${key}: ${error}`);
  }
  return key;
}

export async function getImage(key: string): Promise<Uint8Array | null> {
  const storage = getStorage();
  const { ok, value } = await storage.downloadAsBytes(key);
  if (!ok || !value) return null;
  // SDK returns [Buffer] tuple
  const buf = value[0];
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
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
  builtPromptPass1?: string;
  builtPromptPass2?: string;
  inputBase64?: string;
  pass1Base64?: string;
  outputBase64?: string;
}

export async function logGeneration(params: GenerationLogParams): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  await ensureTable();

  // Save full-size images to filesystem
  const ts = Date.now();
  const prefix = `${ts}_${params.styleId}`;

  const [inputPath, pass1Path, outputPath] = await Promise.all([
    params.inputBase64 ? saveImage(params.inputBase64, `${prefix}_input`) : null,
    params.pass1Base64 ? saveImage(params.pass1Base64, `${prefix}_pass1`) : null,
    params.outputBase64 ? saveImage(params.outputBase64, `${prefix}_output`) : null,
  ]);

  const db = getPool();
  await db.query(
    `INSERT INTO generation_logs (
      ip, style_id, surface_prompt, furniture_prompt, with_furniture,
      input_width, input_height, model_used, pass1_model, pass2_model,
      duration_ms, pass1_duration_ms, pass2_duration_ms,
      success, error_message,
      built_prompt_pass1, built_prompt_pass2,
      input_image_path, pass1_image_path, output_image_path
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
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
      params.builtPromptPass1 ?? null,
      params.builtPromptPass2 ?? null,
      inputPath,
      pass1Path,
      outputPath,
    ]
  );
}
