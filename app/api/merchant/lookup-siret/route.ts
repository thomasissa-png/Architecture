/**
 * F4.A — SIRET Lookup API.
 *
 * POST /api/merchant/lookup-siret
 * Body: { siret: "12345678901234" }
 *
 * Primary: Pappers API (requires PAPPERS_API_KEY, 100 req/day free).
 * Fallback: API INSEE SIRENE (free, no key required for basic info).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── Validation ──────────────────────────────────────────────────────

function isValidSiret(siret: string): boolean {
  return /^\d{14}$/.test(siret);
}

// ─── Pappers API ─────────────────────────────────────────────────────

interface PappersResponse {
  nom_entreprise?: string;
  siege?: {
    adresse_ligne_1?: string;
    code_postal?: string;
    ville?: string;
  };
  forme_juridique?: string;
  dirigeants?: Array<{
    nom?: string;
    prenom?: string;
    qualite?: string;
  }>;
  code_naf?: string;
}

async function lookupViaPappers(siret: string): Promise<{
  raisonSociale: string;
  adresse: string;
  formeJuridique: string;
  dirigeant: string | null;
  codeNaf: string | null;
} | null> {
  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.pappers.fr/v2/entreprise?siret=${siret}&api_token=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) return null;

    const data: PappersResponse = await res.json();

    const adresseParts = [
      data.siege?.adresse_ligne_1,
      data.siege?.code_postal,
      data.siege?.ville,
    ].filter(Boolean);

    const dirigeant = data.dirigeants?.[0]
      ? `${data.dirigeants[0].prenom || ""} ${data.dirigeants[0].nom || ""}`.trim()
      : null;

    return {
      raisonSociale: data.nom_entreprise || "",
      adresse: adresseParts.join(", "),
      formeJuridique: data.forme_juridique || "",
      dirigeant,
      codeNaf: data.code_naf || null,
    };
  } catch {
    return null;
  }
}

// ─── INSEE SIRENE Fallback ───────────────────────────────────────────

interface InseeResponse {
  etablissement?: {
    uniteLegale?: {
      denominationUniteLegale?: string;
      categorieJuridiqueUniteLegale?: string;
    };
    adresseEtablissement?: {
      numeroVoieEtablissement?: string;
      typeVoieEtablissement?: string;
      libelleVoieEtablissement?: string;
      codePostalEtablissement?: string;
      libelleCommuneEtablissement?: string;
    };
    activitePrincipaleEtablissement?: string;
  };
}

async function lookupViaInsee(siret: string): Promise<{
  raisonSociale: string;
  adresse: string;
  formeJuridique: string;
  dirigeant: string | null;
  codeNaf: string | null;
} | null> {
  try {
    const res = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3.11/siret/${siret}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;

    const data: InseeResponse = await res.json();
    const etab = data.etablissement;
    if (!etab) return null;

    const addr = etab.adresseEtablissement;
    const adresseParts = [
      [addr?.numeroVoieEtablissement, addr?.typeVoieEtablissement, addr?.libelleVoieEtablissement]
        .filter(Boolean)
        .join(" "),
      addr?.codePostalEtablissement,
      addr?.libelleCommuneEtablissement,
    ].filter(Boolean);

    return {
      raisonSociale: etab.uniteLegale?.denominationUniteLegale || "",
      adresse: adresseParts.join(", "),
      formeJuridique: etab.uniteLegale?.categorieJuridiqueUniteLegale || "",
      dirigeant: null,
      codeNaf: etab.activitePrincipaleEtablissement || null,
    };
  } catch {
    return null;
  }
}

// ─── POST Handler ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  let body: { siret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  const siret = body.siret?.replace(/\s/g, "");
  if (!siret || !isValidSiret(siret)) {
    return NextResponse.json(
      { error: "Le SIRET doit contenir exactement 14 chiffres." },
      { status: 400 }
    );
  }

  // Try Pappers first, then INSEE
  const result = await lookupViaPappers(siret) || await lookupViaInsee(siret);

  if (!result) {
    return NextResponse.json(
      { error: "SIRET introuvable. Verifiez le numero et reessayez." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
