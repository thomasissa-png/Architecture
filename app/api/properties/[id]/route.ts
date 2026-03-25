/**
 * Property detail API.
 * GET    /api/properties/[id] — Get property detail
 * PATCH  /api/properties/[id] — Update property
 * DELETE /api/properties/[id] — Delete property
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "@/lib/properties";

export const dynamic = "force-dynamic";

// ─── GET: Property detail ────────────────────────────────────────────
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
    return NextResponse.json({ property });
  } catch (err) {
    console.error("Error getting property:", err);
    return NextResponse.json(
      { error: "Erreur lors de la r\u00E9cup\u00E9ration du bien." },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update property ──────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Only allow specific fields to be updated
    const allowedFields = [
      "addressRaw",
      "propertyType",
      "roomCount",
      "surfaceM2",
      "floorNumber",
      "salePrice",
      "descriptionFinal",
    ] as const;

    const updates: Record<string, string | number | undefined> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const property = await updateProperty(params.id, session.user.id, updates);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (err) {
    console.error("Error updating property:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise \u00E0 jour du bien." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete property ─────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const deleted = await deleteProperty(params.id, session.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting property:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du bien." },
      { status: 500 }
    );
  }
}
