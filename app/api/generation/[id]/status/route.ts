/**
 * Polling endpoint for queued generation status.
 * GET /api/generation/[id]/status
 * Returns job status, secured by session (user can only see their own jobs).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJobStatus } from "@/lib/generation-queue";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const jobId = params.id;
  if (!jobId) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const job = await getJobStatus(jobId, session.user.id);
  if (!job) {
    return NextResponse.json({ error: "Génération introuvable" }, { status: 404 });
  }

  if (job.status === "done") {
    return NextResponse.json({
      status: "done",
      userPhotoId: job.userPhotoId,
      outputImageKey: job.outputImageKey,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  }

  if (job.status === "failed") {
    return NextResponse.json({
      status: "failed",
      abandonReason: job.abandonReason,
      creditRefunded: true,
    });
  }

  // pending or processing
  return NextResponse.json({
    status: job.status,
    retryCount: job.retryCount,
    createdAt: job.createdAt,
  });
}
