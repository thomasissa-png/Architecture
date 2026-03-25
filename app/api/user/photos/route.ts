/**
 * User Photos API — Gallery of all user generations.
 * GET /api/user/photos — List user's photos with optional filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPhotos } from "@/lib/user-photos";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const url = request.nextUrl;
    const styleId = url.searchParams.get("styleId") || undefined;
    const roomType = url.searchParams.get("roomType") || undefined;
    const associated = url.searchParams.get("associated"); // "true", "false", or absent

    const photos = await getUserPhotos(session.user.id, {
      styleId,
      roomType,
      associatedOnly: associated === "true" ? true : undefined,
      unassociatedOnly: associated === "false" ? true : undefined,
    });

    return NextResponse.json({ photos });
  } catch (err) {
    console.error("Error listing user photos:", err);
    return NextResponse.json(
      { error: "Erreur lors de la r\u00E9cup\u00E9ration des photos." },
      { status: 500 }
    );
  }
}
