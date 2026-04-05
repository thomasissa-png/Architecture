/**
 * POST /api/user/photos/[id]/uncrop
 * Restores the original input image (before crop).
 * Auth required — only the owner can uncrop.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPhotoById } from "@/lib/user-photos";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const photo = await getUserPhotoById(params.id, session.user.id);
  if (!photo) {
    return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  }

  const db = getPool();
  const result = await db.query(
    `SELECT original_input_key FROM user_photos WHERE id = $1 AND user_id = $2`,
    [params.id, session.user.id]
  );

  const originalKey = result.rows[0]?.original_input_key;
  if (!originalKey) {
    return NextResponse.json({ error: "Pas de version originale disponible." }, { status: 400 });
  }

  await db.query(
    `UPDATE user_photos SET input_image_key = $1, original_input_key = NULL WHERE id = $2 AND user_id = $3`,
    [originalKey, params.id, session.user.id]
  );

  return NextResponse.json({ success: true, restoredKey: originalKey });
}
