/**
 * POST /api/pro/projects/:id/rooms/:roomId/photo — Upload photo source pour une pièce
 *
 * Rendu : SSR (force-dynamic) — upload multipart authentifié.
 *
 * Auth + ownership obligatoires.
 * Accepte JPEG, PNG, WEBP, HEIC/HEIF — max 10 Mo.
 * Stocke dans Replit Object Storage : clé `pro/{projectId}/rooms/{roomId}/photo.jpg`
 * Met à jour pro_rooms.photo_path.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, withStorageRetry } from "@/lib/db";
import { ensureProTables } from "@/lib/marchand/db";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  const projectId = params.id;
  const roomId = params.roomId;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  await ensureProTables();

  // ─── Vérifier que la room existe et appartient au projet ────────
  const db = getPool();
  const roomResult = await db.query(
    `SELECT id FROM pro_rooms WHERE id = $1 AND project_id = $2`,
    [roomId, projectId]
  );

  if (roomResult.rows.length === 0) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Pièce introuvable dans ce projet." },
      { status: 404 }
    );
  }

  // ─── Parse multipart form data ──────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "Le body doit être multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("photo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "MISSING_FILE", message: "Le champ « photo » est requis." },
      { status: 400 }
    );
  }

  // ─── Validation type MIME ───────────────────────────────────────
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: "INVALID_TYPE",
        message: `Type de fichier non supporté : ${file.type}. Formats acceptés : JPEG, PNG, WEBP, HEIC.`,
      },
      { status: 400 }
    );
  }

  // ─── Validation taille ──────────────────────────────────────────
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: "FILE_TOO_LARGE",
        message: `Le fichier dépasse la limite de 10 Mo (${(file.size / 1024 / 1024).toFixed(1)} Mo).`,
      },
      { status: 400 }
    );
  }

  try {
    // ─── Lire le fichier en buffer ──────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ─── Upload vers Object Storage ─────────────────────────────
    const storageKey = `pro/${projectId}/rooms/${roomId}/photo.jpg`;

    await withStorageRetry(async (client) => {
      const result = await client.uploadFromBytes(storageKey, buffer);
      if (!result.ok) {
        throw new Error(`Upload échoué : ${result.error}`);
      }
    }, `uploadRoomPhoto(${storageKey})`);

    // ─── Mettre à jour photo_path en DB ─────────────────────────
    await db.query(
      `UPDATE pro_rooms SET photo_path = $1 WHERE id = $2 AND project_id = $3`,
      [storageKey, roomId, projectId]
    );

    console.log(
      `[POST /api/pro/projects/${projectId}/rooms/${roomId}/photo] Uploaded ${(buffer.length / 1024).toFixed(0)} Ko → ${storageKey}`
    );

    return NextResponse.json({ photo_path: storageKey });
  } catch (err) {
    console.error(
      `[POST /api/pro/projects/${projectId}/rooms/${roomId}/photo] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de l'upload de la photo. Réessayez.",
      },
      { status: 500 }
    );
  }
}
