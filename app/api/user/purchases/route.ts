import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPool, ensureTable } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    await ensureTable();
    const db = getPool();

    const result = await db.query(
      `SELECT pack_id, credits_purchased, amount_cents, status, created_at
       FROM purchases
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.user.id]
    );

    return NextResponse.json({ purchases: result.rows });
  } catch (err) {
    console.error("Purchases fetch error:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des achats." },
      { status: 500 }
    );
  }
}
