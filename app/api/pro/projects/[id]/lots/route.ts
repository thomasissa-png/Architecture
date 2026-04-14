/**
 * GET /api/pro/projects/:id/lots — Liste des lots d'un projet avec leurs pièces
 * PUT /api/pro/projects/:id/lots — Sauvegarder la découpe complète
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Auth + ownership obligatoires.
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
  getRoomsByProject,
  deleteProjectLots,
  createLot,
  updateRoomLot,
  updateProjectStatus,
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

// ─── PUT handler — Save complete lot assignment ─────────────────────

interface LotInput {
  name: string;
  lot_type?: string;
  color?: string;
  room_ids?: string[];
  zone_rect?: {
    x_percent: number;
    y_percent: number;
    width_percent: number;
    height_percent: number;
  } | null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  try {
    await ensureProTables();

    // ─── Parse body ──────────────────────────────────────────────
    const body = await request.json();
    const lots: LotInput[] = body.lots;

    if (!Array.isArray(lots) || lots.length === 0) {
      return NextResponse.json(
        { error: "INVALID_BODY", message: "Au moins un lot est requis." },
        { status: 400 }
      );
    }

    // Validate lot structure
    const projectRooms = await getRoomsByProject(projectId);
    const validRoomIds = new Set(projectRooms.map((r) => r.id));

    for (const lot of lots) {
      if (!lot.name || typeof lot.name !== "string") {
        return NextResponse.json(
          { error: "INVALID_BODY", message: "Chaque lot doit avoir un nom." },
          { status: 400 }
        );
      }
      // room_ids is optional — rooms may not exist yet (lots defined before extraction)
      if (lot.room_ids && !Array.isArray(lot.room_ids)) {
        return NextResponse.json(
          { error: "INVALID_BODY", message: "room_ids doit être un tableau." },
          { status: 400 }
        );
      }
      // Validate room_ids if provided and rooms exist
      if (lot.room_ids && validRoomIds.size > 0) {
        for (const roomId of lot.room_ids) {
          if (!validRoomIds.has(roomId)) {
            return NextResponse.json(
              { error: "INVALID_ROOM", message: `Pièce inconnue : ${roomId}` },
              { status: 400 }
            );
          }
        }
      }
    }

    // ─── Delete existing lots and reassign ───────────────────────
    await deleteProjectLots(projectId);

    // ─── Create new lots and assign rooms ────────────────────────
    const createdLots = [];
    for (let i = 0; i < lots.length; i++) {
      const lotInput = lots[i];
      const validLotTypes = ["appartement", "commerce", "bureau", "parking", "autre"];
      const lotType = validLotTypes.includes(lotInput.lot_type || "")
        ? lotInput.lot_type
        : "appartement";

      const created = await createLot({
        projectId,
        name: lotInput.name,
        lotType,
        color: lotInput.color || null,
        sortOrder: i,
        zoneRect: lotInput.zone_rect || null,
      });

      // Assign rooms to this lot (if rooms exist)
      if (lotInput.room_ids) {
        for (const roomId of lotInput.room_ids) {
          await updateRoomLot(roomId, created.id);
        }
      }

      createdLots.push(created);
    }

    // ─── Update project status ───────────────────────────────────
    await updateProjectStatus(projectId, "lots_defined");

    return NextResponse.json({
      success: true,
      lots: createdLots,
    });
  } catch (err) {
    console.error(`[PUT /api/pro/projects/${projectId}/lots] Error:`, err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la sauvegarde des lots.",
      },
      { status: 500 }
    );
  }
}
