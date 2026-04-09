/**
 * POST /api/pro/projects/:id/dossier/pdf — Générer un dossier PDF (V1 = JSON summary)
 *
 * Rendu : SSR (force-dynamic) — lecture DB multi-tables.
 *
 * Auth + ownership obligatoires.
 * Charge les lots sélectionnés avec pièces, visuels, descriptions, recommandations.
 * V1 retourne un JSON structuré ; le rendu PDF sera ajouté en Phase 5.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables } from "@/lib/marchand/db";

export const dynamic = "force-dynamic";

// ─── Validation ─────────────────────────────────────────────────────

const DossierBodySchema = z.object({
  lot_ids: z
    .array(z.string().uuid("Chaque lot_id doit être un UUID valide."))
    .min(1, "Au moins un lot doit être sélectionné."),
});

// ─── POST handler ───────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  const { project } = authResult;

  try {
    await ensureProTables();

    // ─── Parse body ──────────────────────────────────────────────
    const body = await request.json();
    const parsed = DossierBodySchema.safeParse(body);

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

    const { lot_ids } = parsed.data;
    const db = getPool();

    // ─── Load lots and verify ownership ──────────────────────────
    const lotsResult = await db.query(
      `SELECT id, name, floor, target_buyer, style_id, budget_travaux,
              commercial_description, description_is_manual, status
       FROM pro_lots
       WHERE id = ANY($1) AND project_id = $2
       ORDER BY floor ASC, name ASC`,
      [lot_ids, projectId]
    );

    // Check all requested lots were found
    const foundIds = new Set(
      lotsResult.rows.map((r: { id: string }) => r.id)
    );
    const missingIds = lot_ids.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: `Lot(s) introuvable(s) dans ce projet : ${missingIds.join(", ")}`,
        },
        { status: 404 }
      );
    }

    // ─── Build dossier for each lot ──────────────────────────────
    const dossierLots = await Promise.all(
      lotsResult.rows.map(
        async (lot: {
          id: string;
          name: string;
          floor: number | null;
          target_buyer: string | null;
          style_id: string | null;
          budget_travaux: string | null;
          commercial_description: string | null;
          description_is_manual: boolean;
          status: string;
        }) => {
          // Load rooms with visual paths
          const roomsResult = await db.query(
            `SELECT id, name, room_type, surface_m2,
                    visual_output_path, visual_pass1_path, generation_status
             FROM pro_rooms
             WHERE lot_id = $1
             ORDER BY name`,
            [lot.id]
          );

          const rooms = roomsResult.rows.map(
            (r: {
              id: string;
              name: string;
              room_type: string;
              surface_m2: string | null;
              visual_output_path: string | null;
              visual_pass1_path: string | null;
              generation_status: string;
            }) => ({
              id: r.id,
              name: r.name,
              room_type: r.room_type,
              surface_m2:
                r.surface_m2 !== null ? Number(r.surface_m2) : null,
              visual_url:
                r.visual_output_path
                  ? `/api/pro/projects/${projectId}/image?key=${encodeURIComponent(r.visual_output_path)}`
                  : null,
              generation_status: r.generation_status,
            })
          );

          // Load accepted recommendations
          const recsResult = await db.query(
            `SELECT id, title, description, action_type, estimated_cost_eur,
                    impact_level, affected_rooms, rationale_buyer
             FROM pro_recommendations
             WHERE lot_id = $1 AND is_active = TRUE AND is_accepted = TRUE
             ORDER BY impact_level DESC, created_at ASC`,
            [lot.id]
          );

          const recommendations = recsResult.rows.map(
            (r: {
              id: string;
              title: string;
              description: string;
              action_type: string;
              estimated_cost_eur: string | null;
              impact_level: string;
              affected_rooms: string[];
              rationale_buyer: string | null;
            }) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              action_type: r.action_type,
              estimated_cost_eur:
                r.estimated_cost_eur !== null
                  ? Number(r.estimated_cost_eur)
                  : null,
              impact_level: r.impact_level,
              affected_rooms: r.affected_rooms,
              rationale_buyer: r.rationale_buyer,
            })
          );

          // Compute total surface from rooms
          const totalSurface = rooms.reduce(
            (sum: number, r: { surface_m2: number | null }) =>
              sum + (r.surface_m2 ?? 0),
            0
          );

          return {
            id: lot.id,
            name: lot.name,
            floor: lot.floor !== null ? Number(lot.floor) : null,
            surface_m2: totalSurface > 0 ? totalSurface : null,
            style: lot.style_id,
            target_buyer: lot.target_buyer,
            commercial_description: lot.commercial_description,
            description_is_manual: lot.description_is_manual,
            rooms,
            recommendations,
          };
        }
      )
    );

    console.log(
      `[POST /api/pro/projects/${projectId}/dossier/pdf] Built dossier JSON for ${dossierLots.length} lot(s)`
    );

    return NextResponse.json({
      project: {
        id: project.id,
        adresse: project.adresse,
        type_bien: project.type_bien,
        surface_totale: project.surface_totale,
      },
      lots: dossierLots,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      `[POST /api/pro/projects/${projectId}/dossier/pdf] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la génération du dossier. Réessayez.",
      },
      { status: 500 }
    );
  }
}
