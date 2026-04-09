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
import { ensureProTables } from "@/lib/marchand/db";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
  checkRateLimit,
} from "@/lib/marchand/auth-helpers";
import { generateRecommendations } from "@/lib/marchand/architect-agent";
import type { ValidatedRoom, LotQualification } from "@/lib/marchand/schemas";

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

  await ensureProTables();

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
       FROM pro_lots WHERE id = $1 AND project_id = $2`,
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
       FROM pro_rooms WHERE lot_id = $1 AND project_id = $2
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
    const validatedRooms: ValidatedRoom[] = rooms.map((r: Record<string, unknown>) => ({
      temp_id: String(r.id),
      id: String(r.id),
      name_raw: String(r.name),
      room_type: String(r.room_type) as ValidatedRoom["room_type"],
      surface_m2: r.surface_m2 as number | null,
      dimensions: r.length_m && r.width_m
        ? { length_m: Number(r.length_m), width_m: Number(r.width_m) }
        : null,
      ceiling_height_m: r.ceiling_height_m as number | null,
      windows_count: Number(r.windows_count ?? 0),
      doors_count: Number(r.doors_count ?? 0),
      floor: r.floor as number | null,
      confidence: 1,
      shape: r.shape as ValidatedRoom["shape"] ?? null,
      notes: null,
      lot_id: String(r.lot_id ?? lot_id),
      is_estimated: false,
      photo_path: r.photo_path as string | null ?? null,
    }));

    const lotQualification: LotQualification = {
      id: String(lot.id),
      name: String(lot.name),
      target_buyer: String(lot.target_buyer) as LotQualification["target_buyer"],
      style_id: String(lot.style_id ?? "contemporain"),
      budget_travaux: lot.budget_travaux as number | null,
      contraintes: lot.contraintes as string | null,
      notes_commerciales: lot.notes_commerciales as string | null,
      rooms: validatedRooms,
    };

    const recommendationSet = await generateRecommendations(validatedRooms, lotQualification);

    if (!recommendationSet) {
      return NextResponse.json(
        {
          error: "AGENT_FAILED",
          message: "L'agent architecte n'a pas pu générer de recommandations. Réessayez.",
        },
        { status: 502 }
      );
    }

    // ─── Archive old recommendations ─────────────────────────────
    await db.query(
      `UPDATE pro_recommendations SET is_active = false WHERE lot_id = $1 AND is_active = true`,
      [lot_id]
    );

    // ─── Get current max version for this lot ────────────────────
    const versionResult = await db.query(
      `SELECT COALESCE(MAX(version), 0)::int AS max_version
       FROM pro_recommendations WHERE lot_id = $1`,
      [lot_id]
    );
    const nextVersion = (versionResult.rows[0]?.max_version ?? 0) + 1;

    // ─── Insert new recommendations ──────────────────────────────
    for (const rec of recommendationSet.recommendations) {
      await db.query(
        `INSERT INTO pro_recommendations (
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
