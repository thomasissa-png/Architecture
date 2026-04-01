import { NextResponse } from "next/server";
import { getPool, ensureTable } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.ADMIN_PASSWORD && token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  try {
    await ensureTable();
    const pool = getPool();

    // Filters: ?version=v18&limit=6&after_id=28&include_prompts=true
    const version = url.searchParams.get("version");
    const limitParam = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);
    const afterId = url.searchParams.get("after_id");
    const includePrompts = url.searchParams.get("include_prompts") === "true";

    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIdx = 1;

    if (version) {
      conditions.push(`prompt_version = $${paramIdx++}`);
      queryParams.push(version);
    }
    if (afterId) {
      conditions.push(`id > $${paramIdx++}`);
      queryParams.push(parseInt(afterId, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const promptColumns = includePrompts
      ? "built_prompt_pass1, built_prompt_pass2,"
      : "";

    const result = await pool.query(`
      SELECT id, created_at, ip, style_id, model_used, pass1_model, pass2_model,
             duration_ms, pass1_duration_ms, pass2_duration_ms,
             success, error_message,
             input_width, input_height,
             ${promptColumns}
             surface_prompt, furniture_prompt,
             input_image_path, pass1_image_path, output_image_path,
             is_iteration, iteration_number, session_id, user_comment_raw,
             is_replay, replay_source_id, replay_label,
             pixel_diff_pct, color_shift_score, prompt_version,
             room_type, is_outdoor, outdoor_subtype
      FROM generation_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitParam}
    `, queryParams);

    // Also return distinct versions for the filter dropdown
    const versionsResult = await pool.query(`
      SELECT DISTINCT prompt_version FROM generation_logs
      WHERE prompt_version IS NOT NULL
      ORDER BY prompt_version
    `);
    const versions: string[] = versionsResult.rows.map((r: { prompt_version: string }) => r.prompt_version);

    return NextResponse.json({ logs: result.rows, versions });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("GET /api/logs failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
