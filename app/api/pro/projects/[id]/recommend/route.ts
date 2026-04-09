/**
 * POST /api/pro/projects/:id/recommend — Recommandations architecte IA
 *
 * Rendu : SSR (force-dynamic) — appel IA coûteux.
 *
 * Auth + ownership obligatoires.
 * Charge les rooms validées + qualification du lot, appelle l'agent
 * architecte IA, sauvegarde les recommandations en DB.
 * Rate limit : 5 générations de recommandations par projet.
 *
 * Note technique : l'architecture cible (section 3.5) utilise
 * /projects/:id/lots/:lot_id/recommendations, mais cette route
 * simplifie en acceptant lot_id dans le body pour le MVP.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
  checkRateLimit,
} from "@/lib/marchand/auth-helpers";
// TODO: import { generateRecommendations } from "@/lib/marchand/architect-agent";

export const dynamic = "force-dynamic";

// ─── Validation ─────────────────────────────────────────────────────

const RecommendBodySchema = z.object({
  lot_id: z.string().uuid("lot_id doit être un UUID valide."),
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

  // ─── Status check ──────────────────────────────────────────────
  const validStatuses = ["validated", "qualified", "plan_final"];
  if (!validStatuses.includes(project.status)) {
    return NextResponse.json(
      {
        error: "INVALID_STATUS",
        message: "Les recommandations ne sont possibles qu'après validation du plan.",
      },
      { status: 409 }
    );
  }

  // ─── Rate limit: 5 recommendation generations per project ──────
  if (!checkRateLimit("recommend", projectId, 5, 3600_000)) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT",
        message: "Maximum 5 générations de recommandations par projet et par heure.",
      },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  try {
    // ─── Parse body ──────────────────────────────────────────────
    const body = await request.json();
    const parsed = RecommendBodySchema.safeParse(body);

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

    const { lot_id } = parsed.data;

    const db = getPool();

    // ─── Verify lot belongs to this project ──────────────────────
    const lotResult = await db.query(
      `SELECT id, name, target_buyer, style_id, budget_travaux, contraintes, notes_commerciales
       FROM lots WHERE id = $1 AND project_id = $2`,
      [lot_id, projectId]
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
      `SELECT id, name, room_type, surface_m2, length_m, width_m,
              ceiling_height_m, windows_count, doors_count, floor, shape
       FROM rooms WHERE lot_id = $1 AND project_id = $2
       ORDER BY floor, name`,
      [lot_id, projectId]
    );

    if (roomsResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: "INCOMPLETE_DATA",
          message: "Aucune pièce assignée à ce lot. Assignez des pièces avant de demander des recommandations.",
        },
        { status: 422 }
      );
    }

    const rooms = roomsResult.rows;

    // ─── Call architect agent IA ──────────────────────────────────
    // TODO: Replace with real generateRecommendations() when lib/marchand/architect-agent.ts is ready
    // const recommendationSet = await generateRecommendations({
    //   lot: {
    //     ...lot,
    //     rooms,
    //   },
    //   projectInfo: {
    //     adresse: project.adresse,
    //     type_bien: project.type_bien,
    //     surface_totale: project.surface_totale,
    //   },
    // });

    // TEMPORARY STUB — remove when architect-agent is available
    console.warn(
      `[POST /api/pro/projects/${projectId}/recommend] architect-agent not yet available. Using stub.`
    );
    const recommendationSet = {
      recommendations: [] as Array<{
        id: string;
        title: string;
        description: string;
        action_type: string;
        estimated_cost_eur: number | null;
        impact_level: string;
        affected_rooms: string[];
        rationale_buyer: string;
      }>,
      summary: "Agent architecte non encore disponible.",
    };
    // END STUB

    // ─── Archive old recommendations ─────────────────────────────
    await db.query(
      `UPDATE recommendations SET is_active = false WHERE lot_id = $1 AND is_active = true`,
      [lot_id]
    );

    // ─── Get current max version for this lot ────────────────────
    const versionResult = await db.query(
      `SELECT COALESCE(MAX(version), 0)::int AS max_version
       FROM recommendations WHERE lot_id = $1`,
      [lot_id]
    );
    const nextVersion = (versionResult.rows[0]?.max_version ?? 0) + 1;

    // ─── Insert new recommendations ──────────────────────────────
    for (const rec of recommendationSet.recommendations) {
      await db.query(
        `INSERT INTO recommendations (
          lot_id, title, description, action_type,
          estimated_cost_eur, impact_level, affected_rooms,
          rationale_buyer, is_active, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)`,
        [
          lot_id,
          rec.title,
          rec.description,
          rec.action_type,
          rec.estimated_cost_eur,
          rec.impact_level,
          rec.affected_rooms,
          rec.rationale_buyer,
          nextVersion,
        ]
      );
    }

    console.log(
      `[POST /api/pro/projects/${projectId}/recommend] Generated ${recommendationSet.recommendations.length} recommendations for lot ${lot_id} (v${nextVersion})`
    );

    return NextResponse.json({
      recommendations: recommendationSet.recommendations,
      summary: recommendationSet.summary,
      version: nextVersion,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[POST /api/pro/projects/${projectId}/recommend] Error:`, err);
    return NextResponse.json(
      {
        error: "API_ERROR",
        message: "Erreur lors de la génération des recommandations. Réessayez.",
      },
      { status: 500 }
    );
  }
}
