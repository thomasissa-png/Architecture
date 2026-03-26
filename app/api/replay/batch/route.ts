import { NextRequest, NextResponse } from "next/server";
import { ensureTable } from "@/lib/db";
const REPLAY_INTERNAL_HEADER = "x-replay-internal";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/replay/batch — Replay multiple generations sequentially.
 *
 * Body: {
 *   password: string,                 // ADMIN_PASSWORD (required)
 *   sourceGenerationIds: number[],
 *   replayPass?: 1 | 2 | "both",
 *   surfacePrompt?: string,
 *   furniturePrompt?: string,
 *   replayLabel: string,             // required for batch
 * }
 */
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  // H-01: Auth
  const body = await request.json();
  if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  try {
    const {
      sourceGenerationIds,
      replayPass = "both",
      surfacePrompt,
      furniturePrompt,
      replayLabel,
    } = body;

    if (!Array.isArray(sourceGenerationIds) || sourceGenerationIds.length === 0) {
      return NextResponse.json({ error: "sourceGenerationIds requis (array non vide)" }, { status: 400 });
    }
    if (!replayLabel) {
      return NextResponse.json({ error: "replayLabel requis pour un batch" }, { status: 400 });
    }
    if (sourceGenerationIds.length > 20) {
      return NextResponse.json({ error: "Maximum 20 replays par batch" }, { status: 400 });
    }

    await ensureTable();

    const origin = request.nextUrl.origin;
    const results: Array<{
      sourceId: number;
      replayId: number | null;
      success: boolean;
      durationMs: number;
      model?: string;
      pixelDiffPct?: number;
      colorShiftScore?: number;
      error?: string;
    }> = [];

    // Execute replays SEQUENTIALLY to avoid rate limits
    for (const sourceId of sourceGenerationIds) {
      try {
        const replayResponse = await fetch(`${origin}/api/replay`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // H-03: Internal call — bypass auth check in /api/replay
            [REPLAY_INTERNAL_HEADER]: process.env.ADMIN_PASSWORD!,
          },
          body: JSON.stringify({
            sourceGenerationId: sourceId,
            replayPass,
            surfacePrompt,
            furniturePrompt,
            replayLabel,
          }),
        });

        const data = await replayResponse.json();

        if (replayResponse.ok) {
          results.push({
            sourceId,
            replayId: data.replayId,
            success: true,
            durationMs: data.durationMs || 0,
            model: data.model,
            pixelDiffPct: data.metrics?.pixelDiffPct,
            colorShiftScore: data.metrics?.colorShiftScore,
          });
        } else {
          results.push({
            sourceId,
            replayId: null,
            success: false,
            durationMs: 0,
            error: data.error || `HTTP ${replayResponse.status}`,
          });
        }
      } catch (e) {
        results.push({
          sourceId,
          replayId: null,
          success: false,
          durationMs: 0,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    // Summary
    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const avgDuration = succeeded.length > 0
      ? Math.round(succeeded.reduce((sum, r) => sum + r.durationMs, 0) / succeeded.length)
      : 0;
    const validDiffs = succeeded.filter((r) => r.pixelDiffPct != null);
    const avgPixelDiff = validDiffs.length > 0
      ? Math.round(
          (validDiffs.reduce((sum, r) => sum + (r.pixelDiffPct || 0), 0) / validDiffs.length) * 100
        ) / 100
      : null;

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        succeeded: succeeded.length,
        failed: failed.length,
        avgDurationMs: avgDuration,
        avgPixelDiffPct: avgPixelDiff,
        replayLabel,
      },
    });
  } catch (error) {
    console.error("Batch replay error:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
