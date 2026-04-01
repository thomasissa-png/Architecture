/**
 * Property Photos API.
 * POST   /api/properties/[id]/photos — Associate photos to property
 * GET    /api/properties/[id]/photos — Get property photos
 * DELETE /api/properties/[id]/photos — Dissociate photos from property
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPropertyById } from "@/lib/properties";
import {
  getUserPhotos,
  associatePhotosToProperty,
  dissociatePhotosFromProperty,
} from "@/lib/user-photos";

export const dynamic = "force-dynamic";

// ─── POST: Associate photos to property ──────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    // Verify property belongs to user
    const property = await getPropertyById(params.id, session.user.id);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }

    const body = await request.json();
    const { photoIds } = body as { photoIds?: string[] };

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "photoIds requis (tableau non vide)." },
        { status: 400 }
      );
    }

    const updated = await associatePhotosToProperty(
      photoIds,
      params.id,
      session.user.id
    );

    if (updated === 0) {
      return NextResponse.json(
        { associated: 0, warning: "Aucune photo n'a été associée. La photo appartient peut-être déjà à un autre bien." },
        { status: 200 }
      );
    }
    return NextResponse.json({ associated: updated });
  } catch (err) {
    console.error("Error associating photos:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'association des photos." },
      { status: 500 }
    );
  }
}

// ─── GET: Get photos associated with property ────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const property = await getPropertyById(params.id, session.user.id);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }

    const photos = await getUserPhotos(session.user.id, {
      propertyId: params.id,
    });

    return NextResponse.json({ photos });
  } catch (err) {
    console.error("Error getting property photos:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des photos." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Dissociate photos from property ─────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const property = await getPropertyById(params.id, session.user.id);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }

    const body = await request.json();
    const { photoIds } = body as { photoIds?: string[] };

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "photoIds requis (tableau non vide)." },
        { status: 400 }
      );
    }

    const removed = await dissociatePhotosFromProperty(
      photoIds,
      params.id,
      session.user.id
    );

    return NextResponse.json({ dissociated: removed });
  } catch (err) {
    console.error("Error dissociating photos:", err);
    return NextResponse.json(
      { error: "Erreur lors de la dissociation des photos." },
      { status: 500 }
    );
  }
}
