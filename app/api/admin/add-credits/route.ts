/**
 * Admin API — Add credits to a user by email.
 * POST /api/admin/add-credits
 * Body: { password: string, email: string, credits: number }
 * Protected by ADMIN_PASSWORD env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTable } from "@/lib/db";
import { addCredits, getUserCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, email, credits } = body as {
      password?: string;
      email?: string;
      credits?: number;
    };

    // Auth check
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Acc\u00E8s refus\u00E9." },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }

    if (!credits || typeof credits !== "number" || credits <= 0 || !Number.isInteger(credits)) {
      return NextResponse.json(
        { error: "Nombre de cr\u00E9dits invalide (entier positif requis)." },
        { status: 400 }
      );
    }

    // Find user by email
    await ensureTable();
    const db = getPool();
    const userResult = await db.query(
      `SELECT id, email, credits_remaining FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Utilisateur introuvable pour l'email : ${email}` },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Add credits
    await addCredits(userId, credits);

    // Get new balance
    const newBalance = await getUserCredits(userId);

    return NextResponse.json({
      success: true,
      email: userResult.rows[0].email,
      creditsAdded: credits,
      newBalance,
    });
  } catch (err) {
    console.error("Admin add-credits error:", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
