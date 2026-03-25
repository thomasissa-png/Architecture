/**
 * GET /api/properties/[id]/annonce
 * Returns the active annonce UUID for a property, if any.
 * Auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveAnnonceForProperty } from "@/lib/annonce";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  const annonce = await getActiveAnnonceForProperty(
    session.user.id,
    params.id
  );

  return NextResponse.json({
    uuid: annonce?.uuid || null,
  });
}
