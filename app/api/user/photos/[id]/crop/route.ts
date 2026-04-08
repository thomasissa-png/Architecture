/**
 * POST /api/user/photos/[id]/crop
 *
 * Session 38 (BR-6) : crop du résultat GÉNÉRÉ (output_image_key), pas de l'input.
 * Avant ce fix, le crop remplaçait l'image BEFORE (`input_image_key`). Le fondateur
 * veut cropper l'image APRÈS (résultat IA) pour ajuster le cadrage final avant
 * partage/dossier. La backup est stockée dans `original_output_key` (réversible
 * via /uncrop).
 *
 * Auth required — only the owner can crop.
 * Body: { croppedImage: "data:image/jpeg;base64,..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPhotoById } from "@/lib/user-photos";
import { saveImage } from "@/lib/db";
import { getPool } from "@/lib/db";

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

  const photo = await getUserPhotoById(params.id, session.user.id);
  if (!photo) {
    return NextResponse.json(
      { error: "Photo introuvable." },
      { status: 404 }
    );
  }

  if (!photo.output_image_key) {
    return NextResponse.json(
      { error: "Cette photo n'a pas de résultat généré à recadrer." },
      { status: 400 }
    );
  }

  let body: { croppedImage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const { croppedImage } = body;
  if (!croppedImage || !croppedImage.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Image recadrée manquante ou invalide." },
      { status: 400 }
    );
  }

  try {
    // Extract base64 from data URI
    const base64 = croppedImage.split(",")[1];
    if (!base64) {
      return NextResponse.json(
        { error: "Format d'image invalide." },
        { status: 400 }
      );
    }

    // Save cropped image to Object Storage
    const cropName = `${Date.now()}_cropped_${params.id}`;
    const newKey = await saveImage(base64, cropName);

    // Backup original output key before overwriting (reversible crop)
    const db = getPool();

    // Add original_output_key column if missing (idempotent)
    await db.query(`
      ALTER TABLE user_photos ADD COLUMN IF NOT EXISTS original_output_key VARCHAR(255)
    `).catch(() => { /* column may already exist */ });

    // Save original key only on first crop (don't overwrite with a previous crop)
    await db.query(
      `UPDATE user_photos
       SET output_image_key = $1,
           original_output_key = COALESCE(original_output_key, output_image_key)
       WHERE id = $2 AND user_id = $3`,
      [newKey, params.id, session.user.id]
    );

    return NextResponse.json({ success: true, newOutputKey: newKey });
  } catch (err) {
    console.error("[crop] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Erreur lors du recadrage." },
      { status: 500 }
    );
  }
}
