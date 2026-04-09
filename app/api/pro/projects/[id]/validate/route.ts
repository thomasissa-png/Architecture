/**
 * PUT /api/pro/projects/:id/validate — Valider le plan après correction utilisateur
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Auth + ownership obligatoires.
 * Vérifie que toutes les pièces ont un nom et un room_type.
 * Si immeuble : vérifie que chaque pièce est assignée à un lot.
 * Passe le projet en status 'validated'.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";

export const dynamic = "force-dynamic";

// ─── PUT handler ────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  const { project } = authResult;

  // ─── Status check ──────────────────────────────────────────────
  if (project.status !== "extraction_done") {
    return NextResponse.json(
      {
        error: "INVALID_STATUS",
        message: "La validation n'est possible qu'après l'extraction du plan.",
      },
      { status: 409 }
    );
  }

  try {
    const db = getPool();

    // ─── Fetch all rooms for this project ─────────────────────────
    const roomsResult = await db.query(
      `SELECT id, name, room_type, lot_id FROM rooms WHERE project_id = $1`,
      [projectId]
    );

    const rooms = roomsResult.rows as Array<{
      id: string;
      name: string;
      room_type: string;
      lot_id: string | null;
    }>;

    if (rooms.length === 0) {
      return NextResponse.json(
        {
          error: "INCOMPLETE_DATA",
          missing: ["rooms"],
          message: "Aucune pièce trouvée pour ce projet. Relancez l'extraction.",
        },
        { status: 422 }
      );
    }

    // ─── Validate: every room has name + room_type ────────────────
    const missing: string[] = [];

    const roomsMissingName = rooms.filter(
      (r) => !r.name || r.name.trim().length === 0
    );
    if (roomsMissingName.length > 0) {
      missing.push(
        `${roomsMissingName.length} pièce(s) sans nom : ${roomsMissingName.map((r) => r.id).join(", ")}`
      );
    }

    const roomsMissingType = rooms.filter(
      (r) => !r.room_type || r.room_type === "autre"
    );
    if (roomsMissingType.length > 0) {
      missing.push(
        `${roomsMissingType.length} pièce(s) sans type défini : ${roomsMissingType.map((r) => r.id).join(", ")}`
      );
    }

    // ─── If immeuble: every room must be assigned to a lot ────────
    if (project.type_bien === "immeuble") {
      const roomsNoLot = rooms.filter((r) => !r.lot_id);
      if (roomsNoLot.length > 0) {
        missing.push(
          `${roomsNoLot.length} pièce(s) non assignée(s) à un lot : ${roomsNoLot.map((r) => r.id).join(", ")}`
        );
      }
    }

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "INCOMPLETE_DATA",
          missing,
          message: "Des informations manquent avant de valider.",
        },
        { status: 422 }
      );
    }

    // ─── Count lots ──────────────────────────────────────────────
    const lotsResult = await db.query(
      `SELECT COUNT(*)::int AS count FROM lots WHERE project_id = $1`,
      [projectId]
    );
    const lotsCount = lotsResult.rows[0]?.count ?? 0;

    // ─── Update project status ───────────────────────────────────
    await db.query(
      `UPDATE projects SET status = 'validated', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );

    console.log(
      `[PUT /api/pro/projects/${projectId}/validate] Validated — ${rooms.length} rooms, ${lotsCount} lots`
    );

    return NextResponse.json({
      status: "validated",
      rooms_count: rooms.length,
      lots_count: lotsCount,
    });
  } catch (err) {
    console.error(`[PUT /api/pro/projects/${projectId}/validate] Error:`, err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la validation. Réessayez.",
      },
      { status: 500 }
    );
  }
}
