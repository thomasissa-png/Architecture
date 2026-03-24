import { Pool } from "pg";

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

// ─── Auto-create tables on first use ─────────────────────────────────
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

    CREATE TABLE IF NOT EXISTS pass1_cache (
      key TEXT PRIMARY KEY,
      image BYTEA NOT NULL,
      meta JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pass1_cache_created ON pass1_cache (created_at DESC);

    CREATE TABLE IF NOT EXISTS log_images (
      key TEXT PRIMARY KEY,
      image BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  tableEnsured = true;
}

// ─── Save image to PostgreSQL (replaces Object Storage) ──────────────

async function saveImage(base64: string, name: string): Promise<string> {
  const key = `logs/${name}.jpg`;
  if (!process.env.DATABASE_URL) return key;
  await ensureTable();
  const db = getPool();
  const buffer = Buffer.from(base64, "base64");
  await db.query(
    `INSERT INTO log_images (key, image) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
    [key, buffer]
  );
  return key;
}

export async function getImage(key: string): Promise<Uint8Array | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    await ensureTable();
    const db = getPool();
    const result = await db.query(`SELECT image FROM log_images WHERE key = $1`, [key]);
    if (result.rows.length === 0) return null;
    const buf = result.rows[0].image;
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch (err) {
    console.error(`getImage: exception for key "${key}":`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Storage health check (PostgreSQL) ───────────────────────────────

export async function checkStorageHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!process.env.DATABASE_URL) {
      return { ok: false, error: "DATABASE_URL not configured" };
    }
    await ensureTable();
    const db = getPool();
    await db.query(`SELECT 1`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Pass 1 cache for F1 iterations (PostgreSQL) ─────────────────────

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
  if (!process.env.DATABASE_URL) return;
  await ensureTable();
  const db = getPool();
  const imgBuffer = Buffer.from(imageBase64, "base64");
  await db.query(
    `INSERT INTO pass1_cache (key, image, meta, created_at) VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET image = $2, meta = $3, created_at = NOW()`,
    [key, imgBuffer, JSON.stringify(meta)]
  );
}

export async function getPass1Cache(
  key: string
): Promise<{ imageBase64: string; meta: Pass1Meta } | null> {
  if (!process.env.DATABASE_URL) return null;
  await ensureTable();
  const db = getPool();
  const result = await db.query(`SELECT image, meta FROM pass1_cache WHERE key = $1`, [key]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const imageBase64 = Buffer.from(row.image).toString("base64");
  const meta: Pass1Meta = typeof row.meta === "string" ? JSON.parse(row.meta) : row.meta;
  return { imageBase64, meta };
}

export async function getPass1Meta(key: string): Promise<Pass1Meta | null> {
  if (!process.env.DATABASE_URL) return null;
  await ensureTable();
  const db = getPool();
  const result = await db.query(`SELECT meta FROM pass1_cache WHERE key = $1`, [key]);
  if (result.rows.length === 0) return null;
  return typeof result.rows[0].meta === "string" ? JSON.parse(result.rows[0].meta) : result.rows[0].meta;
}

// ─── Cleanup old pass1 cache entries (TTL: 24h) ─────────────────────

async function cleanupOldPass1Cache(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const db = getPool();
    await db.query(`DELETE FROM pass1_cache WHERE created_at < NOW() - INTERVAL '24 hours'`);
  } catch (e) {
    console.error("pass1_cache cleanup failed:", e);
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
}

export async function logGeneration(params: GenerationLogParams): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  await ensureTable();

  // Save full-size images to PostgreSQL — each wrapped in try/catch so one
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

  // Probabilistic cleanup (~10% of calls)
  if (Math.random() < 0.1) {
    cleanupOldPass1Cache().catch(() => {});
  }
}
