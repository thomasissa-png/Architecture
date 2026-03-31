/**
 * Cron worker — processes queued generation jobs.
 * Called every 60s by Replit Cron or external scheduler.
 * Secured by CRON_SECRET header.
 */
import { NextRequest, NextResponse } from "next/server";
import { addCredits } from "@/lib/credits";
import { saveImage, getImage } from "@/lib/db";
import { saveUserPhoto } from "@/lib/user-photos";
import {
  claimJobs,
  markJobDone,
  abandonJob,
  scheduleRetry,
  MAX_QUEUE_RETRIES,
  QUEUE_TIMEOUT_MS,
  type QueueJob,
} from "@/lib/generation-queue";
import { runGenerationPipeline, withTimeout } from "@/lib/generation-pipeline";

const PIPELINE_TIMEOUT_MS = 130_000; // 130s timeout per job

// Non-transient errors that should not be retried
const NON_TRANSIENT = [
  "content_policy_violation",
  "invalid_request_error",
  "billing_hard_limit",
];

function isNonTransient(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return NON_TRANSIENT.some((t) => msg.includes(t));
}

async function processJob(job: QueueJob): Promise<void> {
  // Check timeout (45 min since creation)
  if (Date.now() - new Date(job.created_at).getTime() > QUEUE_TIMEOUT_MS) {
    const abandoned = await abandonJob(job.id, "timeout", "Délai dépassé (45 min)");
    if (abandoned) {
      await addCredits(job.user_id, 1);
      console.log(`[queue] Job ${job.id} timed out — credit refunded to ${job.user_id}`);
    }
    return;
  }

  try {
    // Retrieve input image from Object Storage
    const inputImageBytes = await getImage(job.input_image_key);
    if (!inputImageBytes) {
      const abandoned = await abandonJob(job.id, "non_transient", "Image input introuvable dans le stockage");
      if (abandoned) await addCredits(job.user_id, 1);
      return;
    }
    const inputBase64 = Buffer.from(inputImageBytes).toString("base64");

    // Run the generation pipeline with timeout
    const result = await withTimeout(
      runGenerationPipeline({
        inputBase64,
        surfacePrompt: job.surface_prompt,
        furniturePrompt: job.furniture_prompt,
        styleId: job.style_id,
        roomType: job.room_type,
        isOutdoor: job.is_outdoor,
        outdoorSubtype: job.outdoor_subtype,
        width: job.input_width,
        height: job.input_height,
        withFurniture: job.with_furniture,
      }),
      PIPELINE_TIMEOUT_MS,
      "queue-pipeline"
    );

    // If pass2 failed in pipeline, still save the result but log warning
    if (result.pass2Failed) {
      console.warn(`[queue] Job ${job.id} pass2 failed — delivering surfaces only`);
    }

    // Save output image to Object Storage
    const ts = Date.now();
    const outputKey = await saveImage(result.outputBase64, `queue_${ts}_${job.style_id || "custom"}_output`);
    const pass1Key = result.pass1Base64
      ? await saveImage(result.pass1Base64, `queue_${ts}_${job.style_id || "custom"}_pass1`).catch(() => null)
      : null;

    // Save to user gallery
    let photoId: string | null = null;
    try {
      photoId = await saveUserPhoto({
        userId: job.user_id,
        inputImageKey: job.input_image_key,
        outputImageKey: outputKey,
        pass1ImageKey: pass1Key,
        styleId: job.style_id || null,
        roomType: job.is_outdoor ? null : (job.room_type || null),
        roomLabel: null,
        isOutdoor: job.is_outdoor || false,
        propertyId: null,
      });
    } catch (err) {
      console.error(`[queue] saveUserPhoto failed for job ${job.id}:`, err);
    }

    // Mark job as done
    await markJobDone(job.id, outputKey, pass1Key, photoId);
    console.log(`[queue] Job ${job.id} completed — photoId=${photoId}, outputKey=${outputKey}`);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[queue] Job ${job.id} attempt ${job.retry_count + 1} failed:`, msg);

    // Non-transient error: abandon immediately
    if (isNonTransient(error)) {
      const abandoned = await abandonJob(job.id, "non_transient", msg);
      if (abandoned) {
        await addCredits(job.user_id, 1);
        console.log(`[queue] Job ${job.id} non-transient error — credit refunded`);
      }
      return;
    }

    // Max retries reached
    if (job.retry_count + 1 >= MAX_QUEUE_RETRIES) {
      const abandoned = await abandonJob(job.id, "max_retries", msg);
      if (abandoned) {
        await addCredits(job.user_id, 1);
        console.log(`[queue] Job ${job.id} max retries — credit refunded`);
      }
      return;
    }

    // Schedule retry with exponential backoff
    await scheduleRetry(job.id, job.retry_count, msg);
    console.log(`[queue] Job ${job.id} scheduled for retry ${job.retry_count + 1}/${MAX_QUEUE_RETRIES}`);
  }
}

export async function POST(request: NextRequest) {
  // Auth: verify cron secret
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Claim up to 2 jobs
    const jobs = await claimJobs(2);

    if (jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending jobs" });
    }

    console.log(`[queue] Processing ${jobs.length} job(s)...`);

    // Process jobs sequentially (avoid overloading OpenAI)
    for (const job of jobs) {
      await processJob(job);
    }

    return NextResponse.json({ processed: jobs.length });
  } catch (error) {
    console.error("[queue] Worker error:", error);
    return NextResponse.json(
      { error: "Worker error", details: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
