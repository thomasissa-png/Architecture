import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, ensureTable } from "@/lib/db";

/**
 * POST /api/admin/seed-user — Create a user account (admin-only).
 * Protected by ADMIN_PASSWORD.
 * Body: { password: string (admin), email: string, userPassword: string, name?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { password, email, userPassword, name } = await req.json();

    // Admin auth
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email || !userPassword) {
      return NextResponse.json({ error: "email and userPassword required" }, { status: 400 });
    }

    await ensureTable();
    const db = getPool();

    const passwordHash = await bcrypt.hash(userPassword, 12);
    const userId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Upsert — create or update password if email exists
    const existing = await db.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE users SET password_hash = $1, name = COALESCE($2, name) WHERE id = $3`,
        [passwordHash, name || null, existing.rows[0].id]
      );
      return NextResponse.json({ success: true, userId: existing.rows[0].id, updated: true });
    }

    await db.query(
      `INSERT INTO users (id, email, name, password_hash, credits_remaining) VALUES ($1, $2, $3, $4, 50)`,
      [userId, email.toLowerCase().trim(), name || null, passwordHash]
    );

    return NextResponse.json({ success: true, userId, created: true });
  } catch (err) {
    console.error("Seed user error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
