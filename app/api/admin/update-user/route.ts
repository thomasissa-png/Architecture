/**
 * Admin API — Update user role, credits, and Pro status.
 * POST /api/admin/update-user
 * Body: { password: string, email: string, role?: string, credits?: number, hasPro?: boolean }
 * Protected by ADMIN_PASSWORD env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTable } from "@/lib/db";
import { addCredits, getUserCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["user", "pro", "admin"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, email, role, credits, hasPro } = body as {
      password?: string;
      email?: string;
      role?: string;
      credits?: number;
      hasPro?: boolean;
    };

    // Auth check
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Accès refusé." },
        { status: 401 }
      );
    }

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Rôle invalide. Valeurs acceptées : ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate credits if provided
    if (credits !== undefined && (typeof credits !== "number" || !Number.isInteger(credits) || credits <= 0)) {
      return NextResponse.json(
        { error: "Nombre de crédits invalide (entier positif requis)." },
        { status: 400 }
      );
    }

    // Find user by email
    await ensureTable();
    const db = getPool();
    const userResult = await db.query(
      `SELECT id, email, credits_remaining, role FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Utilisateur introuvable pour l'email : ${email}` },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const userId = user.id;
    const changes: string[] = [];

    // Update role if provided
    if (role !== undefined) {
      await db.query(
        `UPDATE users SET role = $2 WHERE id = $1`,
        [userId, role]
      );
      changes.push(`role: ${user.role || "user"} -> ${role}`);
    }

    // Add credits if provided
    if (credits !== undefined) {
      await addCredits(userId, credits);
      changes.push(`credits: +${credits}`);
    }

    // Grant Pro access if requested — insert a purchase entry so hasProAccess() returns true
    if (hasPro === true) {
      await db.query(
        `INSERT INTO purchases (user_id, stripe_session_id, pack_id, credits_purchased, amount_cents, status)
         VALUES ($1, $2, 'admin_grant', 50, 0, 'completed')`,
        [userId, `admin_grant_${Date.now()}`]
      );
      changes.push("hasPro: granted (purchase entry created)");
    }

    // Get updated state
    const newBalance = await getUserCredits(userId);
    const updatedUser = await db.query(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      email: user.email,
      role: updatedUser.rows[0]?.role || "user",
      creditsRemaining: newBalance,
      changes,
    });
  } catch (err) {
    console.error("Admin update-user error:", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
