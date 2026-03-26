/**
 * F6 — POST /api/annonce
 * Create an annonce from a property.
 * Requires auth + Pro+ access.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasProAccess } from "@/lib/credits";
import { createAnnonce, getActiveAnnonceForProperty } from "@/lib/annonce";
import { getPropertyById } from "@/lib/properties";
import { getUserPhotos } from "@/lib/user-photos";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  const proAccess = await hasProAccess(session.user.id);
  if (!proAccess) {
    return NextResponse.json(
      { error: "Acces reserve aux utilisateurs Pro." },
      { status: 403 }
    );
  }

  let body: { propertyId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide." },
      { status: 400 }
    );
  }

  const { propertyId } = body;
  if (!propertyId) {
    return NextResponse.json(
      { error: "propertyId requis." },
      { status: 400 }
    );
  }

  // Verify property belongs to user
  const property = await getPropertyById(propertyId, session.user.id);
  if (!property) {
    return NextResponse.json(
      { error: "Bien introuvable." },
      { status: 404 }
    );
  }

  // Verify property has photos
  const photos = await getUserPhotos(session.user.id, { propertyId });
  if (photos.length === 0) {
    return NextResponse.json(
      { error: "Aucune photo associée à ce bien." },
      { status: 400 }
    );
  }

  // Idempotence: return existing active annonce if one exists
  const existing = await getActiveAnnonceForProperty(session.user.id, propertyId);
  if (existing) {
    return NextResponse.json({ uuid: existing.uuid }, { status: 200 });
  }

  // Build auto-generated title: Format A "T3 60 m² — Quartier, Ville"
  const piecesPart = property.room_count ? `T${property.room_count}` : null;
  const surfacePart = property.surface_m2 ? `${property.surface_m2} m²` : null;
  const addressPart = property.address_normalized?.trim() || property.address_raw?.trim() || null;
  const cityPart = property.city?.trim() || null;

  // Short address: strip city from full address for brevity
  const shortAddr = addressPart && cityPart && addressPart.includes(cityPart)
    ? addressPart.replace(cityPart, "").replace(/,\s*$/, "").trim() || null
    : addressPart || null;

  // Location: "Rue Henri Barbusse, Le Mans" or just "Le Mans"
  const location = shortAddr && cityPart
    ? `${shortAddr}, ${cityPart}`
    : shortAddr || cityPart || null;

  // Property: "T3 60 m²" or "T3" or "60 m²"
  const propertyDesc = [piecesPart, surfacePart].filter(Boolean).join(" ");

  let title: string;
  if (propertyDesc && location) {
    title = `${propertyDesc} \u2014 ${location}`;
  } else if (propertyDesc) {
    title = propertyDesc;
  } else if (location) {
    title = location;
  } else {
    title = "Annonce immobilière";
  }

  const annonce = await createAnnonce({
    userId: session.user.id,
    propertyId,
    title,
  });

  return NextResponse.json({ uuid: annonce.uuid }, { status: 201 });
}
