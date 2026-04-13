/**
 * PATCH /api/pro/projects/:id/draft — Sauvegarder un brouillon (pièces)
 *
 * Rendu : SSR (force-dynamic) — mutation DB.
 *
 * Auth + ownership obligatoires.
 * Sauvegarde les modifications de pièces sans changer le statut du projet.
 * Même logique que PUT /validate pour les INSERT/UPDATE/DELETE de pièces,
 * mais sans la validation complète ni le changement de statut.
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

// ─── Zod schema ────────────────────────────────────────────────────

const RoomDraftSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  room_type: z.enum([
    "salon", "cuisine", "chambre", "sdb", "wc",
    "bureau", "couloir", "cave", "autre",
  ]),
  surface_m2: z.number().positive().max(999).nullable(),
  isNew: z.boolean().optional().default(false),
});

const BuildingOutlineSchema = z.object({
  x_percent: z.number().min(0).max(100),
  y_percent: z.number().min(0).max(100),
  width_percent: z.number().min(1).max(100),
  height_percent: z.number().min(1).max(100),
});

const DraftBodySchema = z.object({
  rooms: z.array(RoomDraftSchema),
  building_outline: BuildingOutlineSchema.nullable().optional(),
});

// ─── PATCH handler ─────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  await ensureProTables();

  try {
    const db = getPool();

    // ─── Parse body ──────────────────────────────────────────────
    const rawBody = await request.json();
    const parseResult = DraftBodySchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Données de brouillon invalides.",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { rooms } = parseResult.data;
    const roomIdMapping: Record<string, string> = {};

    // ─── Fetch existing room IDs ─────────────────────────────────
    const existingResult = await db.query<{ id: string }>(
      `SELECT id FROM pro_rooms WHERE project_id = $1`,
      [projectId]
    );
    const existingIds = new Set(existingResult.rows.map((r) => r.id));

    // ─── Collect IDs sent by client (excluding new rooms) ────────
    const sentIds = new Set(
      rooms.filter((r) => !r.isNew && !r.id.startsWith("new-")).map((r) => r.id)
    );

    // ─── DELETE rooms absent from body ───────────────────────────
    for (const existingId of Array.from(existingIds)) {
      if (!sentIds.has(existingId)) {
        await db.query(
          `DELETE FROM pro_rooms WHERE id = $1 AND project_id = $2`,
          [existingId, projectId]
        );
      }
    }

    // ─── UPDATE or INSERT each room ──────────────────────────────
    for (const room of rooms) {
      if (room.isNew || room.id.startsWith("new-")) {
        const insertResult = await db.query(
          `INSERT INTO pro_rooms (project_id, name, room_type, surface_m2, source)
           VALUES ($1, $2, $3, $4, 'manual') RETURNING id`,
          [projectId, room.name, room.room_type, room.surface_m2]
        );
        roomIdMapping[room.id] = insertResult.rows[0].id;
      } else {
        await db.query(
          `UPDATE pro_rooms
           SET name = $1, room_type = $2, surface_m2 = $3
           WHERE id = $4 AND project_id = $5`,
          [room.name, room.room_type, room.surface_m2, room.id, projectId]
        );
      }
    }

    // ─── Update building outline in extraction_data if provided ──
    const { building_outline } = parseResult.data;
    if (building_outline !== undefined) {
      await db.query(
        `UPDATE pro_projects
         SET extraction_data = COALESCE(extraction_data, '{}'::jsonb) || jsonb_build_object('building_outline', $1::jsonb),
             updated_at = NOW()
         WHERE id = $2`,
        [building_outline ? JSON.stringify(building_outline) : "null", projectId]
      );
    } else {
      // ─── Update project timestamp only ───────────────────────
      await db.query(
        `UPDATE pro_projects SET updated_at = NOW() WHERE id = $1`,
        [projectId]
      );
    }

    return NextResponse.json({
      saved: true,
      rooms_count: rooms.length,
      room_id_mapping: roomIdMapping,
    });
  } catch (err) {
    console.error(`[PATCH /api/pro/projects/${projectId}/draft] Error:`, err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la sauvegarde du brouillon.",
      },
      { status: 500 }
    );
  }
}
