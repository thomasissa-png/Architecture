/**
 * GET /api/pro/projects/:id/rooms — Liste des pièces d'un projet
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Auth + ownership obligatoires.
 * Retourne les pièces avec floor, surface, bounding_box pour l'éditeur de plan.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables, getRoomsByProject } from "@/lib/marchand/db";

export const dynamic = "force-dynamic";

// ─── GET handler ────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  try {
    await ensureProTables();

    const rooms = await getRoomsByProject(projectId);

    const mapped = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      room_type: r.room_type,
      surface_m2: r.surface_m2 !== null ? Number(r.surface_m2) : null,
      floor: r.floor ?? 0,
      lot_id: r.lot_id,
      bounding_box: r.bounding_box ?? null,
    }));

    return NextResponse.json({ rooms: mapped });
  } catch (err) {
    console.error(`[GET /api/pro/projects/${projectId}/rooms] Error:`, err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la récupération des pièces.",
      },
      { status: 500 }
    );
  }
}
