/**
 * Properties API — CRUD for user properties (biens).
 * POST /api/properties — Create property + trigger enrichment
 * GET  /api/properties — List user's properties
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createProperty, getPropertiesByUser, updateProperty } from "@/lib/properties";

export const dynamic = "force-dynamic";

// ─── POST: Create a new property + enrich ────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { addressRaw, propertyType, roomCount, surfaceM2, floorNumber, salePrice } = body;

    if (!addressRaw || typeof addressRaw !== "string" || addressRaw.trim().length < 3) {
      return NextResponse.json(
        { error: "L'adresse est requise (minimum 3 caracteres)." },
        { status: 400 }
      );
    }

    // 1. Create property in DB
    const property = await createProperty({
      userId: session.user.id,
      addressRaw: addressRaw.trim(),
      propertyType: propertyType || null,
      roomCount: roomCount ? Number(roomCount) : null,
      surfaceM2: surfaceM2 ? Number(surfaceM2) : null,
      floorNumber: floorNumber || null,
      salePrice: salePrice ? Number(salePrice) : null,
    });

    // 2. Fire-and-forget: enrich property with geocoding, DVF, map, description
    enrichProperty(session.user.id, property.id, addressRaw.trim(), {
      type: propertyType || "",
      surface: surfaceM2 ? Number(surfaceM2) : null,
      nbPieces: roomCount ? Number(roomCount) : null,
    }).catch((err) => {
      console.error("Property enrichment failed:", err);
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    console.error("Error creating property:", err);
    return NextResponse.json(
      { error: "Erreur lors de la cr\u00E9ation du bien." },
      { status: 500 }
    );
  }
}

// ─── GET: List user's properties ─────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  try {
    const properties = await getPropertiesByUser(session.user.id);
    console.log(`[GET /api/properties] user=${session.user.id} found=${properties.length} biens`);
    return NextResponse.json({ properties });
  } catch (err) {
    console.error("Error listing properties:", err);
    console.error("[GET /api/properties] userId:", session.user.id, "error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Erreur lors de la r\u00E9cup\u00E9ration des biens." },
      { status: 500 }
    );
  }
}

// ─── Enrichment (reuses logic from /api/merchant/enrich-property) ────

async function enrichProperty(
  userId: string,
  propertyId: string,
  adresse: string,
  meta: { type: string; surface: number | null; nbPieces: number | null }
) {
  // 1. Geocoding via API Adresse gouv
  const geoRes = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=1`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!geoRes.ok) return;

  const geoData = await geoRes.json();
  const feature = geoData.features?.[0];
  if (!feature) return;

  const [lon, lat] = feature.geometry.coordinates;
  const props = feature.properties;
  const label = props.label || adresse;
  const postcode = props.postcode || "";
  const city = props.city || "";

  // 2. DVF + 3. Map + 4. Description in parallel
  const [dvfResult, mapKey, description] = await Promise.all([
    fetchDVF(lat, lon),
    fetchMap(lat, lon),
    generateDescription(meta.type, meta.surface, label, meta.nbPieces, city),
  ]);

  // 3. Update property with enriched data
  await updateProperty(propertyId, userId, {
    addressNormalized: label,
    latitude: lat,
    longitude: lon,
    postalCode: postcode,
    city: city,
    dvfMedianPriceM2: dvfResult ?? undefined,
    dvfPeriod: dvfResult ? "5 dernieres annees" : undefined,
    mapImageKey: mapKey ?? undefined,
    descriptionGenerated: description ?? undefined,
  });
}

async function fetchDVF(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.cquest.org/dvf?lat=${lat}&lon=${lon}&dist=500`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const results = data.resultats || [];
    const prices = results
      .filter((r: { valeur_fonciere: number; surface_reelle_bati: number }) =>
        r.valeur_fonciere > 0 && r.surface_reelle_bati > 0
      )
      .map((r: { valeur_fonciere: number; surface_reelle_bati: number }) =>
        Math.round(r.valeur_fonciere / r.surface_reelle_bati)
      )
      .filter((v: number) => v > 0);

    return prices.length > 0
      ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length)
      : null;
  } catch {
    return null;
  }
}

async function fetchMap(lat: number, lon: number): Promise<string | null> {
  try {
    const { saveImage } = await import("@/lib/db");
    const url = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=15&size=600x300&markers=${lat},${lon},red-pushpin`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString("base64");
    return await saveImage(base64, `map_property_${Date.now()}`);
  } catch {
    return null;
  }
}

async function generateDescription(
  type: string,
  surface: number | null,
  adresse: string,
  nbPieces: number | null,
  city: string
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const parts: string[] = [];
    parts.push(`Bien : ${type || "bien immobilier"}`);
    if (surface) parts.push(`${surface} m\u00B2`);
    parts.push(`a ${adresse}`);
    if (city) parts.push(`ville : ${city}`);
    if (nbPieces) parts.push(`${nbPieces} pieces`);

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
        { role: "user", content: parts.join(". ") + "." },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
