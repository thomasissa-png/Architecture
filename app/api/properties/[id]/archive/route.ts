/**
 * POST /api/properties/[id]/archive
 * Archives or unarchives a property. Auth required — only the owner can archive.
 * Body: { action: "archive" | "unarchive" } — defaults to "archive"
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { archiveProperty, unarchiveProperty } from "@/lib/properties";

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
    ? await archiveProperty(params.id, session.user.id)
    : await unarchiveProperty(params.id, session.user.id);

  if (!success) {
    return NextResponse.json(
      { error: action === "archive" ? "Impossible d'archiver ce bien." : "Impossible de désarchiver ce bien." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, action });
}
