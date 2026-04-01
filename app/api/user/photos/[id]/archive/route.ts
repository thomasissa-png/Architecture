/**
 * POST /api/user/photos/[id]/archive
 * Archives or unarchives a user photo. Auth required — only the owner can archive.
 * Body: { action: "archive" | "unarchive" } — defaults to "archive"
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { archiveUserPhoto, unarchiveUserPhoto } from "@/lib/user-photos";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
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
    ? await archiveUserPhoto(params.id, session.user.id)
    : await unarchiveUserPhoto(params.id, session.user.id);

  if (!success) {
    return NextResponse.json(
      { error: action === "archive" ? "Impossible d'archiver cette photo." : "Impossible de désarchiver cette photo." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, action });
}
