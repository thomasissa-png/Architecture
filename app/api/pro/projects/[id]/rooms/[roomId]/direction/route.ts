/**
 * PUT /api/pro/projects/:id/rooms/:roomId/direction — Sauvegarder la direction photo
 * DELETE /api/pro/projects/:id/rooms/:roomId/direction — Supprimer la direction photo
 *
 * Rendu : SSR (force-dynamic) — mutation DB.
 *
 * Auth + ownership obligatoires.
 * Sauvegarde la position et l'angle de prise de vue sur le plan.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables, updateRoom, getRoom } from "@/lib/marchand/db";

export const dynamic = "force-dynamic";

const PhotoDirectionSchema = z.object({
  x_percent: z.number().min(0).max(100),
  y_percent: z.number().min(0).max(100),
  angle_deg: z.number().min(0).max(360),
});

// ─── PUT handler ──────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  const { id: projectId, roomId } = params;

  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  await ensureProTables();

  try {
    // Verify room belongs to project
    const room = await getRoom(roomId);
    if (!room || room.project_id !== projectId) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Pièce introuvable." },
        { status: 404 }
      );
    }

    const rawBody = await request.json();
    const parseResult = PhotoDirectionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Données de direction invalides.",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await updateRoom(roomId, {
      photo_direction: parseResult.data,
    });

    return NextResponse.json({ saved: true, photo_direction: parseResult.data });
  } catch (err) {
    console.error(`[PUT direction] Error:`, err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erreur lors de la sauvegarde." },
      { status: 500 }
    );
  }
}

// ─── DELETE handler ───────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  const { id: projectId, roomId } = params;

  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  await ensureProTables();

  try {
    const room = await getRoom(roomId);
    if (!room || room.project_id !== projectId) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Pièce introuvable." },
        { status: 404 }
      );
    }

    await updateRoom(roomId, { photo_direction: null });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error(`[DELETE direction] Error:`, err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
