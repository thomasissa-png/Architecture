/**
 * GET /api/pro/credits — Crédits pro restants de l'utilisateur
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Retourne le nombre de crédits pro (dossiers marchands) restants.
 * Si l'utilisateur n'a jamais acheté de pack pro, retourne 3 (essai gratuit).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPool, ensureTable } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Connexion requise." },
      { status: 401 }
    );
  }

  try {
    await ensureTable();
    const db = getPool();

    // Check if the pro_credits column exists on users table
    const colCheck = await db.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'pro_credits'`
    );

    if (colCheck.rows.length === 0) {
      // Column doesn't exist yet — add it with default 3 (free trial)
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_credits INTEGER DEFAULT 3`);
    }

    const result = await db.query(
      `SELECT pro_credits FROM users WHERE id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      // User not found in DB — return free trial default
      return NextResponse.json({ credits: 3 });
    }

    const credits = result.rows[0].pro_credits ?? 3;
    return NextResponse.json({ credits });
  } catch (err) {
    console.error("[GET /api/pro/credits] Error:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erreur lors de la récupération des crédits." },
      { status: 500 }
    );
  }
}
