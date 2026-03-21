import { NextResponse } from "next/server";
import { Pool } from "pg";

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10_000,
  });
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT id, created_at, style_id, model_used, pass1_model, pass2_model,
             duration_ms, pass1_duration_ms, pass2_duration_ms,
             success, error_message,
             input_width, input_height,
             built_prompt_pass1, built_prompt_pass2,
             input_image_path, pass1_image_path, output_image_path
      FROM generation_logs
      ORDER BY created_at DESC
      LIMIT 50
    `);
    return NextResponse.json({ logs: result.rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await pool.end();
  }
}
