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

  // Build auto-generated title: "{Type} {surface}m2 -- {ville}"
  const typePart = property.property_type
    ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)
    : "Bien";
  const surfacePart = property.surface_m2 ? `${property.surface_m2}m²` : "";
  const cityPart = property.city || "";
  const titleParts = [typePart, surfacePart, cityPart].filter(Boolean);
  const title = titleParts.length > 1
    ? `${titleParts.slice(0, -1).join(" ")} \u2014 ${titleParts[titleParts.length - 1]}`
    : titleParts[0] || "Annonce";

  const annonce = await createAnnonce({
    userId: session.user.id,
    propertyId,
    title,
  });

  return NextResponse.json({ uuid: annonce.uuid }, { status: 201 });
}
