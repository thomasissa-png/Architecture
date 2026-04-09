/**
 * GET /api/pro/projects/:id/lots — Liste des lots d'un projet avec leurs pièces
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Auth + ownership obligatoires.
 * Retourne tous les lots du projet avec les pièces imbriquées.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import {
  ensureProTables,
  getLotsByProject,
  getRoomsByLot,
} from "@/lib/marchand/db";

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

    // ─── Load lots ────────────────────────────────────────────────
    const lots = await getLotsByProject(projectId);

    // ─── Load rooms for each lot ──────────────────────────────────
    const lotsWithRooms = await Promise.all(
      lots.map(async (lot) => {
        const rooms = await getRoomsByLot(lot.id);
        return {
          ...lot,
          rooms,
        };
      })
    );

    return NextResponse.json({ lots: lotsWithRooms });
  } catch (err) {
    console.error(`[GET /api/pro/projects/${projectId}/lots] Error:`, err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la récupération des lots.",
      },
      { status: 500 }
    );
  }
}
