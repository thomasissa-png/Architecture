/**
 * GET /api/pro/projects/:id/status — Polling du statut de génération
 *
 * Rendu : SSR (force-dynamic) — données temps réel.
 *
 * Auth + ownership obligatoires.
 * Retourne le statut du projet et de chaque pièce.
 * Le client poll toutes les 3 secondes pendant la génération.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { ensureProTables } from "@/lib/marchand/db";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";

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

  const { project } = authResult;

  await ensureProTables();

  try {
    const db = getPool();

    // ─── Fetch all rooms with generation status ──────────────────
    const roomsResult = await db.query(
      `SELECT r.id, r.lot_id, r.name, r.room_type,
              r.surface_m2, r.photo_path,
              r.generation_status, r.visual_output_path,
              r.visual_pass1_path, r.generation_error,
              l.name AS lot_name, l.style_id AS lot_style_id
       FROM pro_rooms r
       LEFT JOIN pro_lots l ON r.lot_id = l.id
       WHERE r.project_id = $1
       ORDER BY l.name NULLS LAST, r.name`,
      [projectId]
    );

    const rooms = roomsResult.rows.map(
      (r: {
        id: string;
        lot_id: string | null;
        name: string;
        room_type: string;
        surface_m2: string | null;
        photo_path: string | null;
        generation_status: string;
        visual_output_path: string | null;
        visual_pass1_path: string | null;
        generation_error: string | null;
        lot_name: string | null;
        lot_style_id: string | null;
      }) => ({
        id: r.id,
        lot_id: r.lot_id,
        lot_name: r.lot_name,
        name: r.name,
        room_type: r.room_type,
        surface_m2: r.surface_m2 !== null ? Number(r.surface_m2) : null,
        photo_path: r.photo_path,
        generation_status: r.generation_status,
        visual_output_path: r.visual_output_path,
        visual_pass1_path: r.visual_pass1_path,
        error: r.generation_error,
        style_id: r.lot_style_id,
      })
    );

    // ─── Compute summary ─────────────────────────────────────────
    const total = rooms.length;
    const done = rooms.filter(
      (r: { generation_status: string }) => r.generation_status === "done"
    ).length;
    const failed = rooms.filter(
      (r: { generation_status: string }) => r.generation_status === "failed"
    ).length;
    const generating = rooms.filter(
      (r: { generation_status: string }) =>
        r.generation_status === "generating_pass1" ||
        r.generation_status === "generating_pass2"
    ).length;
    const pending = rooms.filter(
      (r: { generation_status: string }) => r.generation_status === "pending"
    ).length;

    return NextResponse.json({
      project_status: project.status,
      project_adresse: project.adresse || null,
      project_type_bien: project.type_bien || null,
      project_plan_path: project.plan_file_path || null,
      summary: { total, done, failed, generating, pending },
      rooms,
    });
  } catch (err) {
    console.error(`[GET /api/pro/projects/${projectId}/status] Error:`, err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la récupération du statut.",
      },
      { status: 500 }
    );
  }
}
