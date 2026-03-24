import { NextResponse } from "next/server";
import { getPool, ensureTable } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  try {
    await ensureTable();
    const pool = getPool();
    const result = await pool.query(`
      SELECT id, created_at, style_id, model_used, pass1_model, pass2_model,
             duration_ms, pass1_duration_ms, pass2_duration_ms,
             success, error_message,
             input_width, input_height,
             built_prompt_pass1, built_prompt_pass2,
             input_image_path, pass1_image_path, output_image_path,
             is_replay, replay_source_id, replay_label,
             pixel_diff_pct, color_shift_score
      FROM generation_logs
      ORDER BY created_at DESC
      LIMIT 50
    `);
    return NextResponse.json({ logs: result.rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("GET /api/logs failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
