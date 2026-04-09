/**
 * PATCH /api/pro/projects/:id/qualify — Qualifier les lots d'un projet
 *
 * Rendu : SSR (force-dynamic) — mutation DB.
 *
 * Auth + ownership obligatoires.
 * Reçoit un tableau de lots avec cible acheteur, style, budget, contraintes.
 * Met à jour chaque lot puis passe le projet en statut 'qualified'.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables } from "@/lib/marchand/db";
import { TargetBuyerEnum } from "@/lib/marchand/schemas";

export const dynamic = "force-dynamic";

// ─── Validation ─────────────────────────────────────────────────────

const QualifyLotSchema = z.object({
  lot_id: z.string().uuid("lot_id doit être un UUID valide."),
  target_buyer: TargetBuyerEnum,
  style_id: z.string().min(1, "style_id est requis."),
  budget_travaux: z.number().min(0).nullable().optional(),
  contraintes: z.string().nullable().optional(),
  notes_commerciales: z.string().nullable().optional(),
});

const QualifyBodySchema = z.object({
  lots: z
    .array(QualifyLotSchema)
    .min(1, "Au moins un lot doit être qualifié."),
});

// ─── PATCH handler ──────────────────────────────────────────────────

export async function PATCH(
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
    const parsed = QualifyBodySchema.safeParse(body);

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

    const { lots } = parsed.data;
    const db = getPool();

    // ─── Update each lot ─────────────────────────────────────────
    for (const lotData of lots) {
      // Verify lot belongs to this project
      const lotCheck = await db.query(
        `SELECT id FROM pro_lots WHERE id = $1 AND project_id = $2`,
        [lotData.lot_id, projectId]
      );

      if (lotCheck.rows.length === 0) {
        return NextResponse.json(
          {
            error: "NOT_FOUND",
            message: `Lot ${lotData.lot_id} introuvable dans ce projet.`,
          },
          { status: 404 }
        );
      }

      await db.query(
        `UPDATE pro_lots
         SET target_buyer = $1,
             style_id = $2,
             budget_travaux = $3,
             contraintes = $4,
             notes_commerciales = $5,
             status = 'qualified'
         WHERE id = $6`,
        [
          lotData.target_buyer,
          lotData.style_id,
          lotData.budget_travaux ?? null,
          lotData.contraintes ?? null,
          lotData.notes_commerciales ?? null,
          lotData.lot_id,
        ]
      );
    }

    // ─── Update project status ───────────────────────────────────
    await db.query(
      `UPDATE pro_projects SET status = 'qualified', updated_at = NOW() WHERE id = $1`,
      [projectId]
    );

    console.log(
      `[PATCH /api/pro/projects/${projectId}/qualify] Qualified ${lots.length} lot(s)`
    );

    return NextResponse.json({
      status: "qualified",
      lots_count: lots.length,
    });
  } catch (err) {
    console.error(`[PATCH /api/pro/projects/${projectId}/qualify] Error:`, err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la qualification des lots. Réessayez.",
      },
      { status: 500 }
    );
  }
}
