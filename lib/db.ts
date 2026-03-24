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
      output_image_path  TEXT,
      is_iteration       BOOLEAN DEFAULT FALSE,
      iteration_number   INT,
      session_id         VARCHAR(100),
      user_comment_raw   TEXT,
      user_comment_enriched TEXT,
      pass1_cache_key    TEXT,
      room_type          VARCHAR(50),
      is_outdoor         BOOLEAN DEFAULT FALSE,
      outdoor_subtype    VARCHAR(50)
    );
    CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON generation_logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gen_logs_style ON generation_logs (style_id);
  `);
  tableEnsured = true;
}

// ─── Save image to Replit Object Storage (persistent across deploys) ─
// Sprint 19: Resilient StorageClient with retry/reinit.
// The SDK talks to a local sidecar (127.0.0.1:1106). If the sidecar is
// unavailable at init time, the client enters a permanent "error" state
// and never recovers. Fix: detect error state and create a fresh client.
let storageClient: StorageClient | null = null;

function getStorage(): StorageClient {
  if (storageClient) {
    // Check if client is stuck in error state (internal SDK state)
    const state = (storageClient as unknown as { state?: { status?: string } }).state;
    if (state?.status === "error") {
      console.warn("Object Storage client in error state — reinitializing...");
      storageClient = null;
    }
  }
  if (!storageClient) {
    storageClient = new StorageClient();
  }
  return storageClient;
}

/** Run a storage operation with 1 automatic retry (reinit client on failure). */
async function withStorageRetry<T>(
  operation: (client: StorageClient) => Promise<T>,
  label: string
): Promise<T> {
  try {
    return await operation(getStorage());
  } catch (err) {
    console.warn(`Object Storage "${label}" failed, retrying with fresh client...`, err instanceof Error ? err.message : err);
    storageClient = null; // Force reinit
    return await operation(getStorage());
  }
}

async function saveImage(base64: string, name: string): Promise<string> {
  const key = `logs/${name}.jpg`;
  const buffer = Buffer.from(base64, "base64");
  const { ok, error } = await withStorageRetry(
    (client) => client.uploadFromBytes(key, buffer),
    `saveImage(${key})`
  );
  if (!ok) {
    console.error("Object Storage upload failed:", error);
    throw new Error(`Failed to upload ${key}: ${error}`);
  }
  return key;
}

export async function getImage(key: string): Promise<Uint8Array | null> {
  const result = await withStorageRetry(
    (client) => client.downloadAsBytes(key),
    `getImage(${key})`
  );
  const { ok, value } = result;
  if (!ok || !value) return null;
  // SDK returns [Buffer] tuple
  const buf = value[0];
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

// ─── Pass 1 cache for F1 iterations ─────────────────────────────────
// Stores pass 1 image + metadata in Object Storage for re-pass 2.

export interface Pass1Meta {
  width: number;
  height: number;
  styleId: string;
  furniturePrompt: string;
  surfacePrompt: string;
  createdAt: number; // Date.now()
  roomType?: string | null; // F2: room type for iteration coherence
  isOutdoor?: boolean; // F3: outdoor mode
  outdoorSubtype?: string | null; // F3: terrasse, balcon, patio, jardin, rooftop
}

export async function savePass1Cache(
  key: string,
  imageBase64: string,
  meta: Pass1Meta
): Promise<void> {
  // Save image (with retry)
  const imgBuffer = Buffer.from(imageBase64, "base64");
  const imgResult = await withStorageRetry(
    (client) => client.uploadFromBytes(key, imgBuffer),
    `savePass1Cache-img(${key})`
  );
  if (!imgResult.ok) {
    throw new Error(`Failed to cache pass1 image: ${imgResult.error}`);
  }

  // Save meta alongside (with retry)
  const metaKey = key.replace(".jpg", "_meta.json");
  const metaBuffer = Buffer.from(JSON.stringify(meta), "utf-8");
  const metaResult = await withStorageRetry(
    (client) => client.uploadFromBytes(metaKey, metaBuffer),
    `savePass1Cache-meta(${metaKey})`
  );
  if (!metaResult.ok) {
    throw new Error(`Failed to cache pass1 meta: ${metaResult.error}`);
  }
}

export async function getPass1Cache(
  key: string
): Promise<{ imageBase64: string; meta: Pass1Meta } | null> {
  // Read image (with retry)
  const imgResult = await withStorageRetry(
    (client) => client.downloadAsBytes(key),
    `getPass1Cache-img(${key})`
  );
  if (!imgResult.ok || !imgResult.value) return null;
  const imgBuf = imgResult.value[0];
  const imageBase64 = Buffer.from(imgBuf.buffer, imgBuf.byteOffset, imgBuf.byteLength).toString("base64");

  // Read meta (with retry)
  const metaKey = key.replace(".jpg", "_meta.json");
  const metaResult = await withStorageRetry(
    (client) => client.downloadAsBytes(metaKey),
    `getPass1Cache-meta(${metaKey})`
  );
  if (!metaResult.ok || !metaResult.value) return null;
  const metaBuf = metaResult.value[0];
  const meta: Pass1Meta = JSON.parse(
    Buffer.from(metaBuf.buffer, metaBuf.byteOffset, metaBuf.byteLength).toString("utf-8")
  );

  return { imageBase64, meta };
}

export async function getPass1Meta(key: string): Promise<Pass1Meta | null> {
  const metaKey = key.replace(".jpg", "_meta.json");
  const result = await withStorageRetry(
    (client) => client.downloadAsBytes(metaKey),
    `getPass1Meta(${metaKey})`
  );
  if (!result.ok || !result.value) return null;
  const buf = result.value[0];
  return JSON.parse(
    Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength).toString("utf-8")
  );
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
  // Iteration fields (F1)
  isIteration?: boolean;
  iterationNumber?: number;
  sessionId?: string;
  userCommentRaw?: string;
  userCommentEnriched?: string;
  pass1CacheKey?: string;
  roomType?: string | null;
  // F3 outdoor fields
  isOutdoor?: boolean;
  outdoorSubtype?: string | null;
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
      input_image_path, pass1_image_path, output_image_path,
      is_iteration, iteration_number, session_id,
      user_comment_raw, user_comment_enriched, pass1_cache_key,
      room_type, is_outdoor, outdoor_subtype
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
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
      params.isIteration ?? false,
      params.iterationNumber ?? null,
      params.sessionId ?? null,
      params.userCommentRaw ?? null,
      params.userCommentEnriched ?? null,
      params.pass1CacheKey ?? null,
      params.roomType ?? null,
      params.isOutdoor ?? false,
      params.outdoorSubtype ?? null,
    ]
  );
}
