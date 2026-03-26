/**
 * F4.B — Property Enrichment API.
 *
 * POST /api/merchant/enrich-property
 * Body: { adresse, surface?, type?, nbPieces? }
 *
 * 1. Geocoding via API Adresse gouv (free, no key)
 * 2. DVF open data for price/m2 (free, no key)
 * 3. Static map via OpenStreetMap (free, no key)
 * 4. Commercial description via GPT-4.1-mini
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveImage } from "@/lib/db";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────

interface GeocodingResult {
  lat: number;
  lon: number;
  label: string;
  postcode: string;
  city: string;
  context: string;
}

interface DVFTransaction {
  date: string;
  prix: number;
  surface: number;
  prixM2: number;
  type: string;
}

// ─── Geocoding: API Adresse gouv ─────────────────────────────────────

async function geocodeAddress(adresse: string): Promise<GeocodingResult | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const [lon, lat] = feature.geometry.coordinates;
    const props = feature.properties;

    return {
      lat,
      lon,
      label: props.label || adresse,
      postcode: props.postcode || "",
      city: props.city || "",
      context: props.context || "",
    };
  } catch {
    return null;
  }
}

// ─── Address suggestions: API Adresse gouv ──────────────────────────

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&type=housenumber`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data = await res.json();
    const suggestions = (data.features || []).map(
      (f: { properties: { label: string; postcode: string; city: string }; geometry: { coordinates: [number, number] } }) => ({
        label: f.properties.label,
        postcode: f.properties.postcode,
        city: f.properties.city,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
      })
    );

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

// ─── DVF: Demandes de Valeurs Foncieres ─────────────────────────────

async function fetchDVFData(
  lat: number,
  lon: number
): Promise<{ prixMoyenM2: number | null; transactions: DVFTransaction[] }> {
  try {
    const res = await fetch(
      `https://api.cquest.org/dvf?lat=${lat}&lon=${lon}&dist=500`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { prixMoyenM2: null, transactions: [] };

    const data = await res.json();
    const results = data.resultats || [];

    if (results.length === 0) return { prixMoyenM2: null, transactions: [] };

    const transactions: DVFTransaction[] = results
      .filter((r: { valeur_fonciere: number; surface_reelle_bati: number }) =>
        r.valeur_fonciere > 0 && r.surface_reelle_bati > 0
      )
      .slice(0, 10)
      .map((r: { date_mutation: string; valeur_fonciere: number; surface_reelle_bati: number; type_local: string }) => ({
        date: r.date_mutation,
        prix: r.valeur_fonciere,
        surface: r.surface_reelle_bati,
        prixM2: Math.round(r.valeur_fonciere / r.surface_reelle_bati),
        type: r.type_local || "",
      }));

    const prixM2Values = transactions.map((t) => t.prixM2).filter((v) => v > 0);
    const prixMoyenM2 =
      prixM2Values.length > 0
        ? Math.round(prixM2Values.reduce((a, b) => a + b, 0) / prixM2Values.length)
        : null;

    return { prixMoyenM2, transactions };
  } catch {
    return { prixMoyenM2: null, transactions: [] };
  }
}

// ─── Static map: OpenStreetMap ──────────────────────────────────────

async function fetchStaticMap(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=15&size=600x300&markers=${lat},${lon},red-pushpin`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`[fetchStaticMap] HTTP ${res.status} for ${lat},${lon}`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) {
      console.error(`[fetchStaticMap] Buffer too small (${buffer.length} bytes) — likely invalid image`);
      return null;
    }

    const base64 = buffer.toString("base64");
    const key = await saveImage(base64, `map_${Date.now()}_${lat.toFixed(4)}_${lon.toFixed(4)}`);
    return key;
  } catch (err) {
    console.error(`[fetchStaticMap] Failed for ${lat},${lon}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Commercial description: GPT-4.1-mini ──────────────────────────

const DESCRIPTION_SYSTEM_PROMPT =
  "Tu es un redacteur d'annonces immobilieres expert du marche francais. Tu rediges des descriptions commerciales pour des marchands de biens professionnels.\n\nTon style : precis, factuel, sobre. Aucun superlatif sans preuve. Chaque affirmation est verifiable.\n\nStructure de sortie (respecter cet ordre) :\n1. ACCROCHE (2-3 phrases) : projeter le lecteur dans la vie possible, ancrage local concret, ambiance du quartier\n2. DESCRIPTION DU BIEN (3-4 phrases) : surface, distribution des pieces, etat general, orientation, etage, luminosite\n3. LE QUARTIER (3-4 phrases) : transports a proximite avec lignes et temps a pied, commerces nommes, ecoles si pertinent. Deduis ces informations a partir de l'adresse — tu connais les quartiers francais.\n4. POINTS FORTS (2-3 phrases) : resume des atouts principaux, potentiel d'amenagement si applicable\n5. POTENTIEL (optionnel, 2-3 phrases) : si le bien est brut, a renover ou a une configuration optimisable, decrire le potentiel factuel. Exemples : creation d'une chambre supplementaire, potentiel locatif estime, amelioration DPE possible. Si le bien semble fini, omettre cette section.\n\nRegles :\n- NE JAMAIS ecrire \"bel appartement\", \"charmant\", \"magnifique\", \"spacieux\" sans donnee factuelle\n- NE JAMAIS ecrire \"proche de toutes commodites\" — citer les transports et commerces specifiques\n- Si une donnee n'est pas fournie, la deduire intelligemment de l'adresse ou l'omettre — ne PAS ecrire \"[DONNEE MANQUANTE]\" car c'est un texte final\n- Les visuels meubles generes par IA doivent etre contextualises : \"Projection d'amenagement generee par IA — bien livre vide.\"\n- Si le DPE n'est pas fourni dans les donnees, conclure la description par : \"Le diagnostic de performance energetique (DPE) sera communique sur demande.\"\n\nLongueur cible : 200-350 mots. Reponds uniquement avec la description, sans guillemets ni prefixe ni numerotation.";

async function generateDescription(params: {
  type: string;
  surface: number | null;
  adresse: string;
  nbPieces: number | null;
  prixMoyenM2: number | null;
  city: string;
  salePrice: number | null;
}): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userParts: string[] = [];
    userParts.push(`Type : ${params.type || "bien immobilier"}`);
    if (params.surface) userParts.push(`Surface : ${params.surface} m²`);
    userParts.push(`Adresse : ${params.adresse}`);
    if (params.nbPieces) userParts.push(`Nombre de pièces : ${params.nbPieces}`);
    if (params.city) userParts.push(`Ville : ${params.city}`);
    if (params.salePrice && params.surface) userParts.push(`Prix de vente : ${params.salePrice} EUR (${Math.round(params.salePrice / params.surface)} EUR/m²)`);
    if (params.prixMoyenM2) userParts.push(`Prix moyen du quartier : ${params.prixMoyenM2} EUR/m²`);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: DESCRIPTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userParts.join("\n"),
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// ─── POST Handler ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  let body: {
    adresse?: string;
    surface?: number;
    type?: string;
    nbPieces?: number;
    salePrice?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide." }, { status: 400 });
  }

  const adresse = body.adresse?.trim();
  if (!adresse) {
    return NextResponse.json({ error: "L'adresse est requise." }, { status: 400 });
  }

  // 1. Geocoding
  const geo = await geocodeAddress(adresse);
  if (!geo) {
    return NextResponse.json(
      { error: "Adresse introuvable. Verifiez et reessayez." },
      { status: 404 }
    );
  }

  // 2. DVF + Map in parallel (DVF needed for description)
  const [dvfData, carteImageKey] = await Promise.all([
    fetchDVFData(geo.lat, geo.lon),
    fetchStaticMap(geo.lat, geo.lon),
  ]);

  // 3. Description AFTER DVF so price/m2 is available
  const description = await generateDescription({
    type: body.type || "",
    surface: body.surface || null,
    adresse: geo.label,
    nbPieces: body.nbPieces || null,
    prixMoyenM2: dvfData.prixMoyenM2,
    city: geo.city,
    salePrice: body.salePrice ? Number(body.salePrice) : null,
  });

  return NextResponse.json({
    lat: geo.lat,
    lon: geo.lon,
    label: geo.label,
    city: geo.city,
    postcode: geo.postcode,
    context: geo.context,
    prixMoyenM2: dvfData.prixMoyenM2,
    dernieresTransactions: dvfData.transactions.slice(0, 5),
    description,
    carteImageKey,
  });
}
