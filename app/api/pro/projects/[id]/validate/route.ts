/**
 * PUT /api/pro/projects/:id/validate — Valider le plan après correction utilisateur
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Auth + ownership obligatoires.
 * Accepte un body JSON optionnel { rooms: [...] } pour sauvegarder les
 * modifications de pièces (nom, type, surface) avant validation.
 * - id commençant par "new-" → INSERT (pièce ajoutée manuellement)
 * - id existant → UPDATE name, room_type, surface_m2
 * - id en DB mais absent du body → DELETE (pièce supprimée par l'utilisateur)
 *
 * Vérifie que toutes les pièces ont un nom et un room_type.
 * Si immeuble : vérifie que chaque pièce est assignée à un lot.
 * Passe le projet en status 'validated'.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import { ensureProTables } from "@/lib/marchand/db";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";

export const dynamic = "force-dynamic";

// ─── Zod schema for request body ────────────────────────────────────

const RoomInputSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  room_type: z.enum([
    "salon", "cuisine", "chambre", "sdb", "wc",
    "bureau", "couloir", "cave", "autre",
  ]),
  surface_m2: z.number().positive().max(999).nullable(),
  isNew: z.boolean().optional().default(false),
});

const ValidateBodySchema = z.object({
  rooms: z.array(RoomInputSchema).min(1, "Au moins une pièce est requise."),
});

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

  await ensureProTables();

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

    // ─── Parse body (rooms modifications) ─────────────────────────
    let bodyRooms: z.infer<typeof ValidateBodySchema>["rooms"] | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const rawBody = await request.json();
      if (rawBody && rawBody.rooms) {
        const parseResult = ValidateBodySchema.safeParse(rawBody);
        if (!parseResult.success) {
          return NextResponse.json(
            {
              error: "VALIDATION_ERROR",
              message: "Données de pièces invalides.",
              details: parseResult.error.flatten().fieldErrors,
            },
            { status: 400 }
          );
        }
        bodyRooms = parseResult.data.rooms;
      }
    }

    // ─── Apply room modifications if body provided ────────────────
    const roomIdMapping: Record<string, string> = {};

    if (bodyRooms) {
      // 1. Fetch existing room IDs in DB for this project
      const existingResult = await db.query<{ id: string }>(
        `SELECT id FROM pro_rooms WHERE project_id = $1`,
        [projectId]
      );
      const existingIds = new Set(existingResult.rows.map((r) => r.id));

      // 2. Collect IDs sent by client (excluding new rooms)
      const sentIds = new Set(
        bodyRooms.filter((r) => !r.isNew && !r.id.startsWith("new-")).map((r) => r.id)
      );

      // 3. DELETE rooms that exist in DB but are absent from body
      for (const existingId of Array.from(existingIds)) {
        if (!sentIds.has(existingId)) {
          await db.query(
            `DELETE FROM pro_rooms WHERE id = $1 AND project_id = $2`,
            [existingId, projectId]
          );
        }
      }

      // 4. UPDATE or INSERT each room from body
      for (const room of bodyRooms) {
        if (room.isNew || room.id.startsWith("new-")) {
          // INSERT — new room added manually by user
          const insertResult = await db.query(
            `INSERT INTO pro_rooms (project_id, name, room_type, surface_m2, source)
             VALUES ($1, $2, $3, $4, 'manual') RETURNING id`,
            [projectId, room.name, room.room_type, room.surface_m2]
          );
          roomIdMapping[room.id] = insertResult.rows[0].id;
        } else {
          // UPDATE — existing room modified by user
          await db.query(
            `UPDATE pro_rooms
             SET name = $1, room_type = $2, surface_m2 = $3
             WHERE id = $4 AND project_id = $5`,
            [room.name, room.room_type, room.surface_m2, room.id, projectId]
          );
        }
      }
    }

    // ─── Fetch all rooms for validation checks ────────────────────
    const roomsResult = await db.query(
      `SELECT id, name, room_type, lot_id FROM pro_rooms WHERE project_id = $1`,
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
      `SELECT COUNT(*)::int AS count FROM pro_lots WHERE project_id = $1`,
      [projectId]
    );
    const lotsCount = lotsResult.rows[0]?.count ?? 0;

    // ─── Update project status ───────────────────────────────────
    await db.query(
      `UPDATE pro_projects SET status = 'validated', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );

    console.log(
      `[PUT /api/pro/projects/${projectId}/validate] Validated — ${rooms.length} rooms, ${lotsCount} lots`
    );

    return NextResponse.json({
      status: "validated",
      rooms_count: rooms.length,
      lots_count: lotsCount,
      room_id_mapping: roomIdMapping,
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
