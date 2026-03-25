/**
 * F4.A — Company Lookup API.
 *
 * POST /api/merchant/lookup-siret
 * Body: { siret: "12345678901234" }        → lookup by SIRET
 * Body: { query: "Dupont Immobilier" }      → search by company name
 *
 * Primary: Pappers API (requires PAPPERS_API_KEY).
 * Fallback: API INSEE SIRENE (free, no key required for SIRET lookup).
 * Name search only works with Pappers API.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── Validation ──────────────────────────────────────────────────────

function isValidSiret(siret: string): boolean {
  return /^\d{14}$/.test(siret);
}

// ─── Types ───────────────────────────────────────────────────────────

interface CompanyResult {
  raisonSociale: string;
  adresse: string;
  formeJuridique: string;
  dirigeant: string | null;
  codeNaf: string | null;
  siret?: string;
}

// ─── Pappers API — SIRET lookup ──────────────────────────────────────

interface PappersResponse {
  nom_entreprise?: string;
  siege?: {
    siret?: string;
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

async function lookupViaPappers(siret: string): Promise<CompanyResult | null> {
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
      siret,
    };
  } catch {
    return null;
  }
}

// ─── Pappers API — Name search ───────────────────────────────────────

interface PappersSearchResult {
  resultats?: Array<{
    nom_entreprise?: string;
    siren?: string;
    siege?: {
      siret?: string;
      adresse_ligne_1?: string;
      code_postal?: string;
      ville?: string;
    };
    forme_juridique?: string;
    dirigeants?: Array<{
      nom?: string;
      prenom?: string;
    }>;
    code_naf?: string;
  }>;
}

async function searchByName(query: string): Promise<CompanyResult[]> {
  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(query)}&api_token=${apiKey}&par_page=5`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) return [];

    const data: PappersSearchResult = await res.json();
    if (!data.resultats?.length) return [];

    return data.resultats.map((r) => {
      const adresseParts = [
        r.siege?.adresse_ligne_1,
        r.siege?.code_postal,
        r.siege?.ville,
      ].filter(Boolean);

      const dirigeant = r.dirigeants?.[0]
        ? `${r.dirigeants[0].prenom || ""} ${r.dirigeants[0].nom || ""}`.trim()
        : null;

      return {
        raisonSociale: r.nom_entreprise || "",
        adresse: adresseParts.join(", "),
        formeJuridique: r.forme_juridique || "",
        dirigeant,
        codeNaf: r.code_naf || null,
        siret: r.siege?.siret || "",
      };
    });
  } catch {
    return [];
  }
}

// ─── INSEE SIRENE Fallback (SIRET only) ──────────────────────────────

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

async function lookupViaInsee(siret: string): Promise<CompanyResult | null> {
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
      siret,
    };
  } catch {
    return null;
  }
}

// ─── INSEE Reachability Check ─────────────────────────────────────────

async function checkInseeReachable(): Promise<boolean> {
  try {
    // Use a known SIRET (La Poste HQ) to test if INSEE API responds at all
    const res = await fetch(
      "https://api.insee.fr/entreprises/sirene/V3.11/siret/35600000000048",
      {
        method: "HEAD",
        signal: AbortSignal.timeout(4000),
      }
    );
    // Any HTTP response (even 403/404) means the service is reachable
    return res.status < 500;
  } catch {
    return false;
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

  let body: { siret?: string; query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  // ── Search by company name ──
  if (body.query && body.query.trim().length >= 2) {
    const results = await searchByName(body.query.trim());

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Aucune entreprise trouvée. Essayez un autre nom ou entrez le SIRET directement.", results: [] },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  }

  // ── Lookup by SIRET ──
  const siret = body.siret?.replace(/\s/g, "");
  if (!siret || !isValidSiret(siret)) {
    return NextResponse.json(
      { error: "Le SIRET doit contenir exactement 14 chiffres." },
      { status: 400 }
    );
  }

  // Try Pappers first, then INSEE
  const pappersApiKey = process.env.PAPPERS_API_KEY;
  let pappersReachable = false;
  let inseeReachable = false;

  const pappersResult = await lookupViaPappers(siret);
  if (pappersResult) {
    return NextResponse.json(pappersResult);
  }
  // Pappers returned null — either no API key, network error, or SIRET not found
  // We consider Pappers "reachable" only if the key is configured (actual 404 vs no key)
  pappersReachable = !!pappersApiKey;

  const inseeResult = await lookupViaInsee(siret);
  if (inseeResult) {
    return NextResponse.json(inseeResult);
  }
  // INSEE returned null — either network error or SIRET not found
  // We test reachability with a lightweight check: if Pappers was reachable, we trust
  // the SIRET doesn't exist. If neither was reachable, it's a service issue.
  inseeReachable = await checkInseeReachable();

  if (!pappersReachable && !inseeReachable) {
    return NextResponse.json(
      { error: "Service de verification indisponible. Reessayez dans quelques instants.", serviceDown: true },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "SIRET introuvable. Verifiez le numero et reessayez." },
    { status: 404 }
  );
}
