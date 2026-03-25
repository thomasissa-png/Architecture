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
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString("base64");
    const key = await saveImage(base64, `map_${Date.now()}_${lat.toFixed(4)}_${lon.toFixed(4)}`);
    return key;
  } catch {
    return null;
  }
}

// ─── Commercial description: GPT-4.1-mini ──────────────────────────

async function generateDescription(params: {
  type: string;
  surface: number | null;
  adresse: string;
  nbPieces: number | null;
  prixMoyenM2: number | null;
  city: string;
}): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userParts: string[] = [];
    userParts.push(`Bien : ${params.type || "bien immobilier"}`);
    if (params.surface) userParts.push(`${params.surface} m\u00B2`);
    userParts.push(`a ${params.adresse}`);
    if (params.nbPieces) userParts.push(`${params.nbPieces} pieces`);
    if (params.prixMoyenM2) userParts.push(`Prix moyen du quartier : ${params.prixMoyenM2} EUR/m\u00B2`);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "Tu es un redacteur immobilier professionnel. Redige une description commerciale sobre et factuelle de ce bien pour une plaquette de pre-commercialisation. 2-3 phrases maximum. Ton : valorisant sans superlatifs. Mentionne le quartier, la surface, le potentiel. Reponds uniquement avec la description, sans guillemets ni prefixe.",
        },
        {
          role: "user",
          content: userParts.join(". ") + ".",
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

  // 2. DVF + 3. Map + 4. Description — in parallel
  const [dvfData, carteImageKey, description] = await Promise.all([
    fetchDVFData(geo.lat, geo.lon),
    fetchStaticMap(geo.lat, geo.lon),
    generateDescription({
      type: body.type || "",
      surface: body.surface || null,
      adresse: geo.label,
      nbPieces: body.nbPieces || null,
      prixMoyenM2: null, // Will be filled after DVF, but we run in parallel — acceptable trade-off
      city: geo.city,
    }),
  ]);

  // If we got DVF data and no description yet, regenerate with price — skip for perf, acceptable
  // The description is already generated in parallel, which is fine

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
