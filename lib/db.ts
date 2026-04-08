import { Pool } from "pg";
import { Client as StorageClient } from "@replit/object-storage";

// ─── Singleton Pool ──────────────────────────────────────────────────
let pool: Pool | null = null;

export function getPool(): Pool {
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

export async function ensureTable(): Promise<void> {
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

  // Ensure ALL columns exist — covers tables created by older versions of the schema.
  // The CREATE TABLE IF NOT EXISTS above only runs when the table doesn't exist yet.
  // If the table was created by an earlier version (e.g., Sprint 15 with only
  // input_thumbnail/output_thumbnail), columns added later are missing and the
  // INSERT in logGeneration() fails silently (fire-and-forget).
  // Pattern: DO $$ BEGIN ... EXCEPTION WHEN duplicate_column suppresses errors
  // for columns that already exist.
  const migrateColumns = [
    // Sprint 15b — replace thumbnails with full-size image paths + built prompts
    { name: "built_prompt_pass1", type: "TEXT" },
    { name: "built_prompt_pass2", type: "TEXT" },
    { name: "input_image_path", type: "TEXT" },
    { name: "pass1_image_path", type: "TEXT" },
    { name: "output_image_path", type: "TEXT" },
    // F1 — iteration fields
    { name: "is_iteration", type: "BOOLEAN DEFAULT FALSE" },
    { name: "iteration_number", type: "INT" },
    { name: "session_id", type: "VARCHAR(100)" },
    { name: "user_comment_raw", type: "TEXT" },
    { name: "user_comment_enriched", type: "TEXT" },
    { name: "pass1_cache_key", type: "TEXT" },
    // F2 — room type
    { name: "room_type", type: "VARCHAR(50)" },
    // F3 — outdoor
    { name: "is_outdoor", type: "BOOLEAN DEFAULT FALSE" },
    { name: "outdoor_subtype", type: "VARCHAR(50)" },
    // Prompt versioning — correlate generation quality with prompt version
    { name: "prompt_version", type: "VARCHAR(10)" },
    // Pre-pass vision: room geometry inventory extracted by GPT-4.1-mini
    { name: "room_inventory", type: "TEXT" },
    // Sprint 20 — replay
    { name: "is_replay", type: "BOOLEAN DEFAULT FALSE" },
    { name: "replay_source_id", type: "INT" },
    { name: "replay_label", type: "VARCHAR(200)" },
    { name: "pixel_diff_pct", type: "FLOAT" },
    { name: "color_shift_score", type: "FLOAT" },
    // Generation type + best-of-2 tracking
    { name: "generation_type", type: "VARCHAR(30)" },
    { name: "best_of_2_score_1", type: "FLOAT" },
    { name: "best_of_2_score_2", type: "FLOAT" },
    { name: "best_of_2_chosen", type: "INT" },
  ];
  const migrateSql = migrateColumns
    .map(
      (col) =>
        `DO $$ BEGIN ALTER TABLE generation_logs ADD COLUMN ${col.name} ${col.type}; EXCEPTION WHEN duplicate_column THEN NULL; END $$`
    )
    .join("; ");
  await db.query(migrateSql);

  // ─── Auth + Credits tables ──────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      credits_remaining INTEGER DEFAULT 2,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      stripe_session_id TEXT UNIQUE,
      pack_id TEXT NOT NULL,
      credits_purchased INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add password_hash column for email/password auth (idempotent)
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
  `);

  // Add role column for admin/pro/user management (idempotent)
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
  `);

  // Add stripe_customer_id for Customer Portal access (idempotent)
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
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
    storageClient = new StorageClient({ bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID });
  }
  return storageClient;
}

/** Run a storage operation with 1 automatic retry (reinit client on failure). */
export async function withStorageRetry<T>(
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

/** Health-check: upload + download a tiny test blob via withStorageRetry. */
export async function checkStorageHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const testKey = "logs/__storage_test";
    const testBuffer = Buffer.from("ok", "utf-8");
    const upload = await withStorageRetry(
      (client) => client.uploadFromBytes(testKey, testBuffer),
      "checkStorageHealth:upload"
    );
    if (!upload.ok) {
      return { ok: false, error: `Upload failed: ${upload.error}` };
    }
    const download = await withStorageRetry(
      (client) => client.downloadAsBytes(testKey),
      "checkStorageHealth:download"
    );
    if (!download.ok) {
      return { ok: false, error: "Download failed" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function saveImage(base64: string, name: string): Promise<string> {
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

  // Read-after-write verification: confirm the blob is retrievable.
  // Replit Object Storage sidecar can report ok:true but lose data on restart.
  const verify = await withStorageRetry(
    (client) => client.downloadAsBytes(key),
    `saveImage:verify(${key})`
  );
  if (!verify.ok || !verify.value?.[0]) {
    console.error(`[saveImage] VERIFY FAILED — uploaded key "${key}" (${buffer.length} bytes) but immediate read-back returned ok=${verify.ok}`);
    // Retry upload once more
    const retry = await withStorageRetry(
      (client) => client.uploadFromBytes(key, buffer),
      `saveImage:retryUpload(${key})`
    );
    if (!retry.ok) {
      throw new Error(`Failed to upload ${key} after verify+retry: ${retry.error}`);
    }
    // Verify again
    const verify2 = await withStorageRetry(
      (client) => client.downloadAsBytes(key),
      `saveImage:verify2(${key})`
    );
    if (!verify2.ok || !verify2.value?.[0]) {
      throw new Error(`Failed to verify ${key} after retry — data not durable`);
    }
    console.log(`[saveImage] Retry succeeded for key "${key}"`);
  }

  return key;
}

/** Upload a raw buffer to Object Storage with a custom key (no prefix/extension added). */
export async function saveRawBuffer(buffer: Buffer, key: string): Promise<string> {
  const { ok, error } = await withStorageRetry(
    (client) => client.uploadFromBytes(key, buffer),
    `saveRawBuffer(${key})`
  );
  if (!ok) {
    throw new Error(`Failed to upload ${key}: ${error}`);
  }
  return key;
}

export async function getImage(key: string): Promise<Uint8Array | null> {
  try {
    const result = await withStorageRetry(
      (client) => client.downloadAsBytes(key),
      `getImage(${key})`
    );
    const { ok, value } = result;
    if (!ok || !value) {
      // Retry once after 500ms — sidecar eventual consistency
      console.warn(`getImage: key "${key}" not found, retrying after 500ms...`);
      await new Promise((r) => setTimeout(r, 500));
      storageClient = null; // Force fresh client
      const retry = await withStorageRetry(
        (client) => client.downloadAsBytes(key),
        `getImage:retry(${key})`
      );
      if (!retry.ok || !retry.value) {
        console.warn(`getImage: key "${key}" still not found after retry`);
        return null;
      }
      const retryBuf = retry.value[0];
      if (!retryBuf) {
        console.warn(`getImage: key "${key}" returned empty buffer on retry`);
        return null;
      }
      console.log(`getImage: key "${key}" found on retry (${retryBuf.length} bytes)`);
      return new Uint8Array(retryBuf.buffer, retryBuf.byteOffset, retryBuf.byteLength);
    }
    // SDK returns [Buffer] tuple
    const buf = value[0];
    if (!buf) {
      console.warn(`getImage: key "${key}" returned empty buffer`);
      return null;
    }
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch (err) {
    console.error(`getImage: exception for key "${key}":`, err instanceof Error ? err.message : err);
    return null;
  }
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
  // Split-mode fields (progressive display: pass1 shown while pass2 runs)
  pendingPass2?: boolean; // true = pass2 not yet executed, awaiting pass2Only call
  outputSize?: string; // OpenAI size string (e.g. "1536x1024")
  withFurniture?: boolean; // whether furniture pass was requested
  // Auth fallback: getServerSession can return null on Replit sporadically
  userId?: string;
  // Original input image key for gallery "avant" in iterations/pass2Only
  inputImageKey?: string;
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

// ─── Iteration base image cache (furnished result for adjust mode) ───
// Stores the last furnished result so "adjust" iterations can edit it
// instead of starting from the empty pass-1 image.
//
// BR-5 (session 38) — FIX CRITIQUE : la clé était `iteration-base/${sessionId}.jpg`
// → UNE SEULE entrée par session, donc collision quand N photos sont générées
// dans la même batch. Le dernier save écrasait les autres, et tous les refines
// suivants récupéraient la dernière image (souvent la Maximaliste = photo #3),
// quelle que soit la photo à affiner.
//
// Fix : clé dérivée de `pass1Key` (unique par génération). Format sibling du
// pass1 cache — `sessions/{sid}/pass1_{ts}.jpg` → `sessions/{sid}/pass1_{ts}_iter.jpg`.
// Chaque photo a sa propre base d'itération, pas de collision possible.

/** Dérive la clé storage de l'iteration base à partir du pass1Key. */
function iterationBaseKey(pass1Key: string): string {
  // Sibling du pass1 : remplace `.jpg` par `_iter.jpg` (même dossier session)
  if (pass1Key.endsWith(".jpg")) {
    return pass1Key.replace(/\.jpg$/, "_iter.jpg");
  }
  return `${pass1Key}_iter.jpg`;
}

export async function saveIterationBase(
  pass1Key: string,
  imageBase64: string
): Promise<void> {
  const key = iterationBaseKey(pass1Key);
  const buffer = Buffer.from(imageBase64, "base64");
  const { ok, error } = await withStorageRetry(
    (client) => client.uploadFromBytes(key, buffer),
    `saveIterationBase(${key})`
  );
  if (!ok) {
    console.error("saveIterationBase upload failed:", error);
    // Non-blocking: don't throw — caller uses fire-and-forget
  }
}

export async function getIterationBase(
  pass1Key: string
): Promise<string | null> {
  const key = iterationBaseKey(pass1Key);
  try {
    const result = await withStorageRetry(
      (client) => client.downloadAsBytes(key),
      `getIterationBase(${key})`
    );
    if (!result.ok || !result.value) return null;
    const buf = result.value[0];
    if (!buf) return null;
    return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength).toString("base64");
  } catch (err) {
    console.error(`getIterationBase failed for pass1Key "${pass1Key}":`, err instanceof Error ? err.message : err);
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
  // Replay fields (Sprint 20)
  isReplay?: boolean;
  replaySourceId?: number | null;
  replayLabel?: string | null;
  pixelDiffPct?: number | null;
  colorShiftScore?: number | null;
  // Prompt versioning
  promptVersion?: string;
  // Pre-pass vision: room geometry inventory
  roomInventory?: string;
  // Generation type tracking
  generationType?: "generation" | "regeneration" | "iteration_adjust" | "iteration_restyle" | "surfaces_only" | "pass2_only";
  // Best-of-2 scoring (SSIM local)
  bestOf2Score1?: number;
  bestOf2Score2?: number;
  bestOf2Chosen?: 1 | 2;
}

export async function logGeneration(params: GenerationLogParams): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  await ensureTable();

  // Save full-size images to Object Storage — each wrapped in .catch() so one
  // failure does not prevent the DB log INSERT from executing.
  const ts = Date.now();
  const prefix = `${ts}_${params.styleId}`;

  const [inputPath, pass1Path, outputPath] = await Promise.all([
    params.inputBase64
      ? saveImage(params.inputBase64, `${prefix}_input`).catch((e) => {
          console.error("saveImage input failed:", e);
          return null;
        })
      : null,
    params.pass1Base64
      ? saveImage(params.pass1Base64, `${prefix}_pass1`).catch((e) => {
          console.error("saveImage pass1 failed:", e);
          return null;
        })
      : null,
    params.outputBase64
      ? saveImage(params.outputBase64, `${prefix}_output`).catch((e) => {
          console.error("saveImage output failed:", e);
          return null;
        })
      : null,
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
      room_type, is_outdoor, outdoor_subtype,
      is_replay, replay_source_id, replay_label,
      pixel_diff_pct, color_shift_score, prompt_version,
      room_inventory,
      generation_type, best_of_2_score_1, best_of_2_score_2, best_of_2_chosen
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40)`,
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
      params.isReplay ?? false,
      params.replaySourceId ?? null,
      params.replayLabel ?? null,
      params.pixelDiffPct ?? null,
      params.colorShiftScore ?? null,
      params.promptVersion ?? null,
      params.roomInventory ?? null,
      params.generationType ?? null,
      params.bestOf2Score1 ?? null,
      params.bestOf2Score2 ?? null,
      params.bestOf2Chosen ?? null,
    ]
  );
}

/** Same as logGeneration but returns the inserted row ID. Used by replay endpoints. */
export async function logGenerationReturningId(params: GenerationLogParams): Promise<number | null> {
  if (!process.env.DATABASE_URL) return null;

  await ensureTable();

  const ts = Date.now();
  const prefix = `${ts}_${params.styleId}`;

  const [inputPath, pass1Path, outputPath] = await Promise.all([
    params.inputBase64
      ? saveImage(params.inputBase64, `${prefix}_input`).catch((e) => {
          console.error("saveImage input failed:", e);
          return null;
        })
      : null,
    params.pass1Base64
      ? saveImage(params.pass1Base64, `${prefix}_pass1`).catch((e) => {
          console.error("saveImage pass1 failed:", e);
          return null;
        })
      : null,
    params.outputBase64
      ? saveImage(params.outputBase64, `${prefix}_output`).catch((e) => {
          console.error("saveImage output failed:", e);
          return null;
        })
      : null,
  ]);

  const db = getPool();
  const result = await db.query(
    `INSERT INTO generation_logs (
      ip, style_id, surface_prompt, furniture_prompt, with_furniture,
      input_width, input_height, model_used, pass1_model, pass2_model,
      duration_ms, pass1_duration_ms, pass2_duration_ms,
      success, error_message,
      built_prompt_pass1, built_prompt_pass2,
      input_image_path, pass1_image_path, output_image_path,
      is_iteration, iteration_number, session_id,
      user_comment_raw, user_comment_enriched, pass1_cache_key,
      room_type, is_outdoor, outdoor_subtype,
      is_replay, replay_source_id, replay_label,
      pixel_diff_pct, color_shift_score, prompt_version,
      room_inventory,
      generation_type, best_of_2_score_1, best_of_2_score_2, best_of_2_chosen
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40)
    RETURNING id`,
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
      params.isReplay ?? false,
      params.replaySourceId ?? null,
      params.replayLabel ?? null,
      params.pixelDiffPct ?? null,
      params.colorShiftScore ?? null,
      params.promptVersion ?? null,
      params.roomInventory ?? null,
      params.generationType ?? null,
      params.bestOf2Score1 ?? null,
      params.bestOf2Score2 ?? null,
      params.bestOf2Chosen ?? null,
    ]
  );

  return result.rows[0]?.id ?? null;
}
