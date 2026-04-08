/**
 * POST /api/user/photos/[id]/uncrop
 *
 * Session 38 (BR-6) : restaure l'image output GÉNÉRÉE originale (avant crop).
 * Avant ce fix, uncrop restaurait `input_image_key` depuis `original_input_key`.
 * Après le fix BR-6, crop opère sur `output_image_key` → uncrop doit restaurer
 * `output_image_key` depuis `original_output_key`.
 *
 * Backward compat : si une photo a encore un `original_input_key` legacy
 * (cropée avant le fix BR-6), on restaure aussi l'input. Au moins un des
 * deux suffit pour considérer qu'une version originale existe.
 *
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

  // Ensure both backup columns exist (idempotent — crop endpoint already creates them)
  await db.query(`
    ALTER TABLE user_photos ADD COLUMN IF NOT EXISTS original_input_key VARCHAR(255)
  `).catch(() => { /* ignore */ });
  await db.query(`
    ALTER TABLE user_photos ADD COLUMN IF NOT EXISTS original_output_key VARCHAR(255)
  `).catch(() => { /* ignore */ });

  const result = await db.query(
    `SELECT original_input_key, original_output_key
     FROM user_photos WHERE id = $1 AND user_id = $2`,
    [params.id, session.user.id]
  );

  const originalInputKey = result.rows[0]?.original_input_key as string | null | undefined;
  const originalOutputKey = result.rows[0]?.original_output_key as string | null | undefined;

  if (!originalInputKey && !originalOutputKey) {
    return NextResponse.json({ error: "Pas de version originale disponible." }, { status: 400 });
  }

  // Build dynamic UPDATE to restore whichever backups exist
  const sets: string[] = [];
  const values: (string | null)[] = [];
  let paramIdx = 1;

  if (originalOutputKey) {
    sets.push(`output_image_key = $${paramIdx++}`, `original_output_key = NULL`);
    values.push(originalOutputKey);
  }
  if (originalInputKey) {
    sets.push(`input_image_key = $${paramIdx++}`, `original_input_key = NULL`);
    values.push(originalInputKey);
  }

  // Append WHERE params
  values.push(params.id, session.user.id);
  const whereIdxId = paramIdx++;
  const whereIdxUser = paramIdx++;

  await db.query(
    `UPDATE user_photos SET ${sets.join(", ")} WHERE id = $${whereIdxId} AND user_id = $${whereIdxUser}`,
    values
  );

  return NextResponse.json({
    success: true,
    restoredOutputKey: originalOutputKey ?? null,
    restoredInputKey: originalInputKey ?? null,
  });
}
