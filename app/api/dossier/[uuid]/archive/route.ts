/**
 * POST /api/dossier/[uuid]/archive
 * Archives or unarchives a dossier. Auth required — only the owner can archive.
 * Body: { action: "archive" | "unarchive" } — defaults to "archive"
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDossierByUuid, archiveDossier, unarchiveDossier } from "@/lib/dossier";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  const dossier = await getDossierByUuid(params.uuid);
  if (!dossier) {
    return NextResponse.json(
      { error: "Dossier introuvable." },
      { status: 404 }
    );
  }

  if (dossier.user_id !== session.user.id) {
    return NextResponse.json(
      { error: "Dossier introuvable." },
      { status: 404 }
    );
  }

  let body: { action?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Default to archive
  }

  const action = body.action === "unarchive" ? "unarchive" : "archive";

  const success = action === "archive"
    ? await archiveDossier(params.uuid, session.user.id)
    : await unarchiveDossier(params.uuid, session.user.id);

  if (!success) {
    return NextResponse.json(
      { error: action === "archive" ? "Impossible d'archiver ce dossier." : "Impossible de désarchiver ce dossier." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, action });
}
