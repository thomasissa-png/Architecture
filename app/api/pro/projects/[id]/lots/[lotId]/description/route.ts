/**
 * POST /api/pro/projects/:id/lots/:lotId/description — Générer une description commerciale IA
 * PUT  /api/pro/projects/:id/lots/:lotId/description — Sauvegarder une description manuelle
 *
 * Rendu : SSR (force-dynamic) — mutation DB + appel IA.
 *
 * Auth + ownership obligatoires.
 * POST : génère via GPT-4.1-mini (lib/marchand/description-generator.ts), sauvegarde en DB.
 * PUT  : sauvegarde une description écrite manuellement par l'utilisateur.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
  checkRateLimit,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables } from "@/lib/marchand/db";
import { generateCommercialDescription } from "@/lib/marchand/description-generator";
import type { LotWithRooms, ProjectInfo } from "@/lib/marchand/schemas";

export const dynamic = "force-dynamic";

// ─── Validation (PUT) ───────────────────────────────────────────────

const ManualDescriptionSchema = z.object({
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères.")
    .max(2000, "La description ne doit pas dépasser 2000 caractères."),
});

// ─── POST handler — Génération IA ───────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; lotId: string } }
) {
  const projectId = params.id;
  const lotId = params.lotId;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  const { project } = authResult;

  // ─── Rate limit: 10 generations per lot per hour ───────────────
  if (!checkRateLimit("description", lotId, 10, 3600_000)) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT",
        message: "Maximum 10 générations de description par lot et par heure.",
      },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  try {
    await ensureProTables();
    const db = getPool();

    // ─── Verify lot belongs to project ───────────────────────────
    const lotResult = await db.query(
      `SELECT id, name, floor, target_buyer, style_id
       FROM pro_lots WHERE id = $1 AND project_id = $2`,
      [lotId, projectId]
    );

    if (lotResult.rows.length === 0) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Lot introuvable dans ce projet." },
        { status: 404 }
      );
    }

    const lot = lotResult.rows[0];

    // ─── Load rooms for this lot ─────────────────────────────────
    const roomsResult = await db.query(
      `SELECT name, room_type, surface_m2
       FROM pro_rooms WHERE lot_id = $1 ORDER BY name`,
      [lotId]
    );

    const lotWithRooms: LotWithRooms = {
      id: lot.id,
      name: lot.name,
      surface_m2: null, // Computed from rooms if needed
      floor: lot.floor !== null ? Number(lot.floor) : null,
      target_buyer: lot.target_buyer,
      style_id: lot.style_id,
      rooms: roomsResult.rows.map(
        (r: { name: string; room_type: string; surface_m2: string | null }) => ({
          name: r.name,
          room_type: r.room_type as LotWithRooms["rooms"][number]["room_type"],
          surface_m2: r.surface_m2 !== null ? Number(r.surface_m2) : null,
        })
      ),
    };

    const projectInfo: ProjectInfo = {
      adresse: project.adresse,
      type_bien: project.type_bien as ProjectInfo["type_bien"],
      surface_totale: project.surface_totale,
    };

    // ─── Generate description via IA ─────────────────────────────
    const description = await generateCommercialDescription(
      lotWithRooms,
      projectInfo
    );

    // ─── Save to DB ──────────────────────────────────────────────
    await db.query(
      `UPDATE pro_lots
       SET commercial_description = $1, description_is_manual = FALSE
       WHERE id = $2`,
      [description, lotId]
    );

    console.log(
      `[POST /api/pro/projects/${projectId}/lots/${lotId}/description] Generated IA description (${description.length} chars)`
    );

    return NextResponse.json({
      description,
      is_manual: false,
    });
  } catch (err) {
    console.error(
      `[POST /api/pro/projects/${projectId}/lots/${lotId}/description] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la génération de la description. Réessayez.",
      },
      { status: 500 }
    );
  }
}

// ─── PUT handler — Sauvegarde manuelle ──────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lotId: string } }
) {
  const projectId = params.id;
  const lotId = params.lotId;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  try {
    await ensureProTables();

    // ─── Parse body ──────────────────────────────────────────────
    const body = await request.json();
    const parsed = ManualDescriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          fields: parsed.error.flatten().fieldErrors,
          message: "Données invalides.",
        },
        { status: 400 }
      );
    }

    const { description } = parsed.data;
    const db = getPool();

    // ─── Verify lot belongs to project ───────────────────────────
    const lotCheck = await db.query(
      `SELECT id FROM pro_lots WHERE id = $1 AND project_id = $2`,
      [lotId, projectId]
    );

    if (lotCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Lot introuvable dans ce projet." },
        { status: 404 }
      );
    }

    // ─── Save to DB ──────────────────────────────────────────────
    await db.query(
      `UPDATE pro_lots
       SET commercial_description = $1, description_is_manual = TRUE
       WHERE id = $2`,
      [description, lotId]
    );

    console.log(
      `[PUT /api/pro/projects/${projectId}/lots/${lotId}/description] Saved manual description (${description.length} chars)`
    );

    return NextResponse.json({
      description,
      is_manual: true,
    });
  } catch (err) {
    console.error(
      `[PUT /api/pro/projects/${projectId}/lots/${lotId}/description] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la sauvegarde de la description. Réessayez.",
      },
      { status: 500 }
    );
  }
}
