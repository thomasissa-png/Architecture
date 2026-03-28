import { NextResponse } from "next/server";
import { getPool, ensureTable } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token =
    url.searchParams.get("token") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (process.env.ADMIN_PASSWORD && token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured" },
      { status: 500 },
    );
  }

  try {
    await ensureTable();
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.credits_remaining,
        u.created_at,
        (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id) AS purchase_count,
        (SELECT COALESCE(SUM(amount_cents), 0) FROM purchases p WHERE p.user_id = u.id AND p.status = 'completed') AS total_spent_cents,
        (SELECT COUNT(*) FROM generation_logs g WHERE g.ip = u.email) AS generation_count
      FROM users u
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error("[admin/users] DB error:", err);
    return NextResponse.json(
      {
        error: "Database error",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
