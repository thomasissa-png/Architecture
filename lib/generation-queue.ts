/**
 * Generation queue — persistent job queue for async retries.
 * When /api/generate fails after server-side retries, the job is queued
 * for background processing by the cron worker.
 */
import { getPool } from "@/lib/db";

// ─── Table creation ──────────────────────────────────────────────────
export async function ensureQueueTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS generation_queue (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id             TEXT NOT NULL,
      input_image_key     TEXT NOT NULL,
      surface_prompt      TEXT NOT NULL,
      furniture_prompt    TEXT NOT NULL,
      style_id            VARCHAR(50),
      room_type           VARCHAR(50),
      is_outdoor          BOOLEAN DEFAULT FALSE,
      outdoor_subtype     VARCHAR(50),
      input_width         INT NOT NULL,
      input_height        INT NOT NULL,
      with_furniture      BOOLEAN NOT NULL DEFAULT TRUE,
      status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','done','failed')),
      retry_count         INT NOT NULL DEFAULT 0,
      next_retry_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      locked_until        TIMESTAMPTZ,
      error_message       TEXT,
      abandon_reason      VARCHAR(50),
      output_image_key    TEXT,
      pass1_image_key     TEXT,
      user_photo_id       UUID,
      started_at          TIMESTAMPTZ,
      completed_at        TIMESTAMPTZ
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_queue_status
    ON generation_queue (status, next_retry_at)
    WHERE status IN ('pending', 'failed')
  `).catch(() => {});
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_queue_user_status
    ON generation_queue (user_id, status)
  `).catch(() => {});
}

// ─── Enqueue a failed generation for background retry ────────────────
export interface EnqueueParams {
  userId: string;
  inputImageKey: string;
  surfacePrompt: string;
  furniturePrompt: string;
  styleId?: string | null;
  roomType?: string | null;
  isOutdoor?: boolean;
  outdoorSubtype?: string | null;
  inputWidth: number;
  inputHeight: number;
  withFurniture?: boolean;
}

export async function enqueueGeneration(params: EnqueueParams): Promise<string> {
  await ensureQueueTable();
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO generation_queue
      (user_id, input_image_key, surface_prompt, furniture_prompt,
       style_id, room_type, is_outdoor, outdoor_subtype,
       input_width, input_height, with_furniture)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      params.userId,
      params.inputImageKey,
      params.surfacePrompt,
      params.furniturePrompt,
      params.styleId ?? null,
      params.roomType ?? null,
      params.isOutdoor ?? false,
      params.outdoorSubtype ?? null,
      params.inputWidth,
      params.inputHeight,
      params.withFurniture ?? true,
    ]
  );
  return result.rows[0].id;
}

// ─── Claim jobs for processing (atomic, prevents double-processing) ──
export interface QueueJob {
  id: string;
  created_at: string;
  user_id: string;
  input_image_key: string;
  surface_prompt: string;
  furniture_prompt: string;
  style_id: string | null;
  room_type: string | null;
  is_outdoor: boolean;
  outdoor_subtype: string | null;
  input_width: number;
  input_height: number;
  with_furniture: boolean;
  retry_count: number;
  status: string;
}

export async function claimJobs(limit: number = 2): Promise<QueueJob[]> {
  await ensureQueueTable();
  const pool = getPool();
  const result = await pool.query(`
    UPDATE generation_queue
    SET status = 'processing',
        locked_until = NOW() + INTERVAL '3 minutes',
        started_at = COALESCE(started_at, NOW()),
        updated_at = NOW()
    WHERE id IN (
      SELECT id FROM generation_queue
      WHERE status = 'pending'
        AND next_retry_at <= NOW()
        AND (locked_until IS NULL OR locked_until < NOW())
      ORDER BY created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `, [limit]);
  return result.rows;
}

// ─── Mark job as done ────────────────────────────────────────────────
export async function markJobDone(
  jobId: string,
  outputImageKey: string,
  pass1ImageKey: string | null,
  userPhotoId: string | null,
): Promise<void> {
  const pool = getPool();
  await pool.query(`
    UPDATE generation_queue
    SET status = 'done',
        output_image_key = $2,
        pass1_image_key = $3,
        user_photo_id = $4,
        completed_at = NOW(),
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = $1
  `, [jobId, outputImageKey, pass1ImageKey, userPhotoId]);
}

// ─── Abandon job (idempotent — returns true if actually abandoned) ───
export async function abandonJob(
  jobId: string,
  reason: string,
  errorMessage?: string,
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(`
    UPDATE generation_queue
    SET status = 'failed',
        abandon_reason = $2,
        error_message = $3,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = $1 AND status != 'failed'
    RETURNING id
  `, [jobId, reason, errorMessage?.slice(0, 500) ?? null]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Schedule retry with exponential backoff ─────────────────────────
const RETRY_DELAYS_MINUTES = [1, 2, 4, 8, 15];

export async function scheduleRetry(
  jobId: string,
  currentRetryCount: number,
  errorMessage: string,
): Promise<void> {
  const delay = RETRY_DELAYS_MINUTES[currentRetryCount] ?? 15;
  const pool = getPool();
  await pool.query(`
    UPDATE generation_queue
    SET status = 'pending',
        retry_count = $2,
        next_retry_at = NOW() + ($3 || ' minutes')::INTERVAL,
        locked_until = NULL,
        error_message = $4,
        updated_at = NOW()
    WHERE id = $1
  `, [jobId, currentRetryCount + 1, String(delay), errorMessage.slice(0, 500)]);
}

// ─── Get job status (for polling endpoint) ───────────────────────────
export interface JobStatus {
  id: string;
  status: string;
  retryCount: number;
  createdAt: string;
  completedAt: string | null;
  abandonReason: string | null;
  userPhotoId: string | null;
  outputImageKey: string | null;
}

export async function getJobStatus(jobId: string, userId: string): Promise<JobStatus | null> {
  await ensureQueueTable();
  const pool = getPool();
  const result = await pool.query(`
    SELECT id, status, retry_count, created_at, completed_at,
           abandon_reason, user_photo_id, output_image_key
    FROM generation_queue
    WHERE id = $1 AND user_id = $2
  `, [jobId, userId]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    status: row.status,
    retryCount: row.retry_count,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    abandonReason: row.abandon_reason,
    userPhotoId: row.user_photo_id,
    outputImageKey: row.output_image_key,
  };
}

// ─── Get pending jobs for a user (for badge count) ───────────────────
export async function getUserPendingCount(userId: string): Promise<number> {
  await ensureQueueTable();
  const pool = getPool();
  const result = await pool.query(`
    SELECT COUNT(*) as count FROM generation_queue
    WHERE user_id = $1 AND status IN ('pending', 'processing')
  `, [userId]);
  return parseInt(result.rows[0].count, 10);
}

// ─── Determine if an error is worth queuing ──────────────────────────
export function shouldQueue(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  const nonTransient = [
    'content_policy_violation',
    'invalid_request_error',
    'billing_hard_limit',
    'invalid_api_key',
    'clé api openai non configurée',
  ];
  return !nonTransient.some((t) => msg.includes(t));
}

// Max retry count and timeout
export const MAX_QUEUE_RETRIES = 5;
export const QUEUE_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes
