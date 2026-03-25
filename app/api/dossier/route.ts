/**
 * F4 — Mode Marchand: Create and list dossiers.
 * POST /api/dossier — Create a new dossier
 * GET /api/dossier — List user's dossiers
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserCredits, hasProAccess } from "@/lib/credits";
import {
  createDossier,
  getDossiersByUser,
} from "@/lib/dossier";

export const dynamic = "force-dynamic";

// ─── POST: Create a new dossier ──────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise pour creer un dossier." },
      { status: 401 }
    );
  }

  // F4.3: Mode Marchand requires Pack Pro minimum (50+ credits purchased)
  const proAccess = await hasProAccess(session.user.id);
  if (!proAccess) {
    return NextResponse.json(
      { error: "Le Mode Marchand est reserve aux utilisateurs ayant achete un Pack Pro ou superieur." },
      { status: 403 }
    );
  }

  // Also check remaining credits
  const credits = await getUserCredits(session.user.id);
  if (credits < 1) {
    return NextResponse.json(
      { error: "Credits insuffisants. Rechargez pour continuer." },
      { status: 402 }
    );
  }

  try {
    const body = await request.json();
    const {
      bienNom,
      bienAdresse,
      bienSurface,
      bienPrix,
      bienType,
      globalStyleId,
    } = body;

    const dossier = await createDossier({
      userId: session.user.id,
      bienNom: bienNom || undefined,
      bienAdresse: bienAdresse || undefined,
      bienSurface: bienSurface ? Number(bienSurface) : undefined,
      bienPrix: bienPrix ? Number(bienPrix) : undefined,
      bienType: bienType || undefined,
      globalStyleId: globalStyleId || undefined,
    });

    return NextResponse.json({ dossier }, { status: 201 });
  } catch (err) {
    console.error("Error creating dossier:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation du dossier." },
      { status: 500 }
    );
  }
}

// ─── GET: List user's dossiers ───────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  try {
    const dossiers = await getDossiersByUser(session.user.id);
    return NextResponse.json({ dossiers });
  } catch (err) {
    console.error("Error listing dossiers:", err);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des dossiers." },
      { status: 500 }
    );
  }
}
