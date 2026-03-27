/**
 * F4.A — Merchant Profile API.
 *
 * GET  /api/merchant/profile — Get current user's merchant profile
 * PUT  /api/merchant/profile — Update merchant profile
 * POST /api/merchant/profile — Upload logo (multipart/form-data)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getMerchantProfile,
  upsertMerchantProfile,
  uploadMerchantLogo,
} from "@/lib/merchant";

export const dynamic = "force-dynamic";

const VALID_FONTS = ["Inter", "Playfair Display", "Montserrat", "Lora", "DM Sans"];
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2Mo

// ─── GET: Retrieve merchant profile ──────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const profile = await getMerchantProfile(session.user.id);
  return NextResponse.json({ profile });
}

// ─── PUT: Update merchant profile ────────────────────────────────────

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide." }, { status: 400 });
  }

  // Validate colors
  if (body.couleurPrincipale && !HEX_COLOR_RE.test(body.couleurPrincipale as string)) {
    return NextResponse.json({ error: "Couleur principale invalide (format #RRGGBB)." }, { status: 400 });
  }
  if (body.couleurSecondaire && !HEX_COLOR_RE.test(body.couleurSecondaire as string)) {
    return NextResponse.json({ error: "Couleur secondaire invalide (format #RRGGBB)." }, { status: 400 });
  }

  // Validate font
  if (body.police && !VALID_FONTS.includes(body.police as string)) {
    return NextResponse.json(
      { error: `Police invalide. Choix possibles : ${VALID_FONTS.join(", ")}.` },
      { status: 400 }
    );
  }

  // Validate email format if provided
  if (body.emailPro && !EMAIL_RE.test(body.emailPro as string)) {
    return NextResponse.json(
      { error: "Adresse email invalide." },
      { status: 400 }
    );
  }

  // Validate SIRET format if provided
  if (body.siret && !/^\d{14}$/.test((body.siret as string).replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Le SIRET doit contenir exactement 14 chiffres." }, { status: 400 });
  }

  try {
    const profile = await upsertMerchantProfile({
      userId: session.user.id,
      isMerchant: Boolean(body.isMerchant),
      siret: body.siret ? (body.siret as string).replace(/\s/g, "") : null,
      raisonSociale: (body.raisonSociale as string) || null,
      adresse: (body.adresse as string) || null,
      telephone: (body.telephone as string) || null,
      emailPro: (body.emailPro as string) || null,
      formeJuridique: (body.formeJuridique as string) || null,
      couleurPrincipale: (body.couleurPrincipale as string) || "#1C1C1E",
      couleurSecondaire: (body.couleurSecondaire as string) || "#7D9B76",
      police: (body.police as string) || "Inter",
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Error upserting merchant profile:", err);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du profil." },
      { status: 500 }
    );
  }
}

// ─── POST: Upload logo ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    // Validate type
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      return NextResponse.json(
        { error: "Format invalide. Seuls PNG et JPG sont acceptés." },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_LOGO_BYTES) {
      return NextResponse.json(
        { error: "Le logo ne doit pas dépasser 2 Mo." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const storageKey = await uploadMerchantLogo(session.user.id, base64);

    return NextResponse.json({ logoStorageKey: storageKey });
  } catch (err) {
    console.error("Error uploading logo:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du logo." },
      { status: 500 }
    );
  }
}
