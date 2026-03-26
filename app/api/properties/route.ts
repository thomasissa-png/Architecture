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
      { error: "Erreur lors de la création du bien." },
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
    console.log(`[GET /api/properties] userId="${session.user.id}" email="${session.user.email}"`);
    const properties = await getPropertiesByUser(session.user.id);
    console.log(`[GET /api/properties] found=${properties.length} biens for userId="${session.user.id}"`);
    return NextResponse.json({ properties });
  } catch (err) {
    console.error("Error listing properties:", err);
    console.error("[GET /api/properties] userId:", session.user.id, "error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des biens." },
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

  // 2. DVF + Map in parallel (DVF needed for description)
  const [dvfResult, mapKey] = await Promise.all([
    fetchDVF(lat, lon),
    fetchMap(lat, lon),
  ]);

  // 3. Description AFTER DVF so price/m2 is available
  const description = await generateDescription(
    meta.type, meta.surface, label, meta.nbPieces, city, dvfResult
  );

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

const DESCRIPTION_SYSTEM_PROMPT =
  "Tu es un redacteur d'annonces immobilieres expert du marche francais. Tu rediges des descriptions commerciales pour des marchands de biens professionnels.\n\nTon style : precis, factuel, sobre. Aucun superlatif sans preuve. Chaque affirmation est verifiable.\n\nStructure de sortie (respecter cet ordre) :\n1. ACCROCHE (2-3 phrases) : projeter le lecteur dans la vie possible, ancrage local concret, ambiance du quartier\n2. DESCRIPTION DU BIEN (3-4 phrases) : surface, distribution des pieces, etat general, orientation, etage, luminosite\n3. LE QUARTIER (3-4 phrases) : transports a proximite avec lignes et temps a pied, commerces nommes, ecoles si pertinent. Deduis ces informations a partir de l'adresse — tu connais les quartiers francais.\n4. POINTS FORTS (2-3 phrases) : resume des atouts principaux, potentiel d'amenagement si applicable\n5. POTENTIEL (optionnel, 2-3 phrases) : si le bien est brut, a renover ou a une configuration optimisable, decrire le potentiel factuel. Exemples : creation d'une chambre supplementaire, potentiel locatif estime, amelioration DPE possible. Si le bien semble fini, omettre cette section.\n\nRegles :\n- NE JAMAIS ecrire \"bel appartement\", \"charmant\", \"magnifique\", \"spacieux\" sans donnee factuelle\n- NE JAMAIS ecrire \"proche de toutes commodites\" — citer les transports et commerces specifiques\n- Si une donnee n'est pas fournie, la deduire intelligemment de l'adresse ou l'omettre — ne PAS ecrire \"[DONNEE MANQUANTE]\" car c'est un texte final\n- Les visuels meubles generes par IA doivent etre contextualises : \"Projection d'amenagement generee par IA — bien livre vide.\"\n- Si le DPE n'est pas fourni dans les donnees, conclure la description par : \"Le diagnostic de performance energetique (DPE) sera communique sur demande.\"\n\nLongueur cible : 200-350 mots. Reponds uniquement avec la description, sans guillemets ni prefixe ni numerotation.";

async function generateDescription(
  type: string,
  surface: number | null,
  adresse: string,
  nbPieces: number | null,
  city: string,
  prixMoyenM2: number | null
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const parts: string[] = [];
    parts.push(`Type : ${type || "bien immobilier"}`);
    if (surface) parts.push(`Surface : ${surface} m²`);
    parts.push(`Adresse : ${adresse}`);
    if (nbPieces) parts.push(`Nombre de pièces : ${nbPieces}`);
    if (city) parts.push(`Ville : ${city}`);
    if (prixMoyenM2) parts.push(`Prix moyen du quartier : ${prixMoyenM2} EUR/m²`);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: DESCRIPTION_SYSTEM_PROMPT,
        },
        { role: "user", content: parts.join("\n") },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
