/**
 * PATCH /api/pro/projects/:id/recommendations/:recId — Accepter/refuser une recommandation
 *
 * Rendu : SSR (force-dynamic) — mutation DB.
 *
 * Auth + ownership obligatoires sur le projet.
 * Vérifie que la recommandation appartient bien à un lot de ce projet.
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

const AcceptanceBodySchema = z.object({
  is_accepted: z.boolean(),
});

// ─── PATCH handler ──────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; recId: string } }
) {
  const projectId = params.id;
  const recId = params.recId;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  try {
    await ensureProTables();

    // ─── Parse body ──────────────────────────────────────────────
    const body = await request.json();
    const parsed = AcceptanceBodySchema.safeParse(body);

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

    const { is_accepted } = parsed.data;
    const db = getPool();

    // ─── Verify recommendation belongs to a lot of this project ──
    const recCheck = await db.query(
      `SELECT r.id, r.lot_id
       FROM pro_recommendations r
       JOIN pro_lots l ON r.lot_id = l.id
       WHERE r.id = $1 AND l.project_id = $2`,
      [recId, projectId]
    );

    if (recCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Recommandation introuvable dans ce projet.",
        },
        { status: 404 }
      );
    }

    // ─── Update acceptance ───────────────────────────────────────
    await db.query(
      `UPDATE pro_recommendations SET is_accepted = $1 WHERE id = $2`,
      [is_accepted, recId]
    );

    console.log(
      `[PATCH /api/pro/projects/${projectId}/recommendations/${recId}] is_accepted=${is_accepted}`
    );

    return NextResponse.json({
      id: recId,
      is_accepted,
    });
  } catch (err) {
    console.error(
      `[PATCH /api/pro/projects/${projectId}/recommendations/${recId}] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la mise à jour de la recommandation. Réessayez.",
      },
      { status: 500 }
    );
  }
}
