/**
 * GET /api/pro/projects/:id/recommendations — Charger les recommandations existantes
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Auth + ownership obligatoires.
 * Retourne les recommandations actives groupées par lot.
 * Permet de consulter les recommandations sans les régénérer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables } from "@/lib/marchand/db";

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
    const db = getPool();

    // ─── Load all active recommendations for this project ────────
    const result = await db.query(
      `SELECT r.id, r.lot_id, r.title, r.description, r.action_type,
              r.estimated_cost_eur, r.impact_level, r.affected_rooms,
              r.rationale_buyer, r.is_accepted, r.version,
              l.name AS lot_name
       FROM pro_recommendations r
       JOIN pro_lots l ON r.lot_id = l.id
       WHERE l.project_id = $1 AND r.is_active = TRUE
       ORDER BY l.name, r.impact_level DESC, r.created_at ASC`,
      [projectId]
    );

    // ─── Group by lot ────────────────────────────────────────────
    const lotMap = new Map<
      string,
      {
        lot_id: string;
        lot_name: string;
        recommendations: Array<{
          id: string;
          title: string;
          description: string;
          action_type: string;
          estimated_cost_eur: number | null;
          impact_level: string;
          affected_rooms: string[];
          rationale_buyer: string | null;
          is_accepted: boolean | null;
        }>;
      }
    >();

    for (const row of result.rows) {
      const r = row as {
        id: string;
        lot_id: string;
        title: string;
        description: string;
        action_type: string;
        estimated_cost_eur: string | null;
        impact_level: string;
        affected_rooms: string[];
        rationale_buyer: string | null;
        is_accepted: boolean | null;
        lot_name: string;
      };

      if (!lotMap.has(r.lot_id)) {
        lotMap.set(r.lot_id, {
          lot_id: r.lot_id,
          lot_name: r.lot_name,
          recommendations: [],
        });
      }

      lotMap.get(r.lot_id)!.recommendations.push({
        id: r.id,
        title: r.title,
        description: r.description,
        action_type: r.action_type,
        estimated_cost_eur:
          r.estimated_cost_eur !== null ? Number(r.estimated_cost_eur) : null,
        impact_level: r.impact_level,
        affected_rooms: r.affected_rooms,
        rationale_buyer: r.rationale_buyer,
        is_accepted: r.is_accepted,
      });
    }

    const lots = Array.from(lotMap.values());
    const totalCount = result.rows.length;

    return NextResponse.json({
      has_recommendations: totalCount > 0,
      total_count: totalCount,
      lots,
    });
  } catch (err) {
    console.error(
      `[GET /api/pro/projects/${projectId}/recommendations] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors du chargement des recommandations.",
      },
      { status: 500 }
    );
  }
}
