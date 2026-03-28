/**
 * F4 — Mode Pro (ex Mode Marchand): Create and list dossiers.
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
import { getMerchantProfile } from "@/lib/merchant";

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

  // F4.3: Mode Pro requires Pro subscription or Pack Pro minimum
  const proAccess = await hasProAccess(session.user.id);
  if (!proAccess) {
    return NextResponse.json(
      { error: "Le Mode Pro est réservé aux abonnés Pro." },
      { status: 403 }
    );
  }

  // Also check remaining credits
  const credits = await getUserCredits(session.user.id);
  if (credits < 1) {
    return NextResponse.json(
      { error: "Plus de visuels disponibles. Rechargez pour continuer." },
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
      latitude,
      longitude,
      ville,
      codePostal,
      descriptionCommerciale,
      carteImageKey,
      prixMoyenM2,
      nbPieces,
    } = body;

    // Fetch merchant profile for company name (used in slug generation)
    const merchant = await getMerchantProfile(session.user.id);

    const dossier = await createDossier({
      userId: session.user.id,
      bienNom: bienNom || undefined,
      bienAdresse: bienAdresse || undefined,
      bienSurface: bienSurface ? Number(bienSurface) : undefined,
      bienPrix: bienPrix ? Number(bienPrix) : undefined,
      bienType: bienType || undefined,
      globalStyleId: globalStyleId || undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      ville: ville || undefined,
      codePostal: codePostal || undefined,
      descriptionCommerciale: descriptionCommerciale || undefined,
      carteImageKey: carteImageKey || undefined,
      prixMoyenM2: prixMoyenM2 ? Number(prixMoyenM2) : undefined,
      nbPieces: nbPieces ? Number(nbPieces) : undefined,
      companyName: merchant?.raison_sociale || null,
    });

    return NextResponse.json({ dossier }, { status: 201 });
  } catch (err) {
    console.error("Error creating dossier:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du dossier." },
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
      { error: "Erreur lors de la récupération des dossiers." },
      { status: 500 }
    );
  }
}
