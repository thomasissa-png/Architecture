/**
 * POST /api/annonce/[uuid]/archive
 * Archives an annonce. Auth required — only the owner can archive.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnnonceByUuid, archiveAnnonce } from "@/lib/annonce";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  const annonce = await getAnnonceByUuid(params.uuid);
  if (!annonce) {
    return NextResponse.json(
      { error: "Annonce introuvable." },
      { status: 404 }
    );
  }

  if (annonce.user_id !== session.user.id) {
    return NextResponse.json(
      { error: "Annonce introuvable." },
      { status: 404 }
    );
  }

  const archived = await archiveAnnonce(params.uuid, session.user.id);
  if (!archived) {
    return NextResponse.json(
      { error: "Impossible d'archiver cette annonce." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
