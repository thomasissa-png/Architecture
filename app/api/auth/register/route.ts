import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, ensureTable } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Mot de passe trop long." },
        { status: 400 }
      );
    }

    await ensureTable();
    const db = getPool();

    // Check if email already exists
    const existing = await db.query(
      `SELECT id, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      // If user exists with password_hash, it's a duplicate registration
      if (existing.rows[0].password_hash) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email. Connectez-vous." },
          { status: 409 }
        );
      }
      // If user exists without password_hash (Google account), link the password
      const passwordHash = await bcrypt.hash(password, 12);
      await db.query(
        `UPDATE users SET password_hash = $1, name = COALESCE($2, name) WHERE id = $3`,
        [passwordHash, name?.trim() || null, existing.rows[0].id]
      );
      return NextResponse.json({ success: true, linked: true });
    }

    // Create new user with email/password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.query(
      `INSERT INTO users (id, email, name, password_hash, credits_remaining)
       VALUES ($1, $2, $3, $4, 3)`,
      [userId, email.toLowerCase().trim(), name?.trim() || null, passwordHash]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}
