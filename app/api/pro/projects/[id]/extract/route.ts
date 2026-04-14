/**
 * POST /api/pro/projects/:id/extract — Extraction IA du plan
 *
 * Rendu : SSR (force-dynamic) — appel IA coûteux.
 *
 * Auth + ownership obligatoires.
 * Charge le plan depuis Object Storage, appelle GPT-4.1 vision
 * pour extraire les pièces, sauvegarde en DB.
 * Rate limit : 3 extractions/projet (anti-boucle coûteuse).
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool, withStorageRetry } from "@/lib/db";
import { ensureProTables } from "@/lib/marchand/db";
import {
  requireProjectOwnership,
  isErrorResponse,
  checkRateLimit,
} from "@/lib/marchand/auth-helpers";
import { extractMultiplePlans, PlanExtractionError, sanitizeSurfaces, validateExtraction } from "@/lib/marchand/plan-extractor";
import type { TypeBien } from "@/lib/marchand/schemas";

export const dynamic = "force-dynamic";

// ─── Room type inference from name_raw ──────────────────────────────

/**
 * Infer room_type from the AI-extracted name_raw (e.g. "Salon" → "salon").
 * Handles French room names with accents and common abbreviations.
 * Fallback to "autre" only if no pattern matches.
 */
function inferRoomType(nameRaw: string): string {
  const n = nameRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/salle.*manger|dining/.test(n)) return "salle_a_manger";
  if (/salon|sejour|living/.test(n)) return "salon";
  if (/cuisine|kitchen|kitchenette/.test(n)) return "cuisine";
  if (/chambre.*parent|suite.*parent|master/.test(n)) return "chambre_parentale";
  if (/chambre|bedroom/.test(n)) return "chambre";
  if (/salle.*bain|sdb|bathroom/.test(n)) return "sdb";
  if (/\bwc\b|toilet/.test(n)) return "wc";
  if (/salle.*reunion|meeting/.test(n)) return "salle_reunion";
  if (/open.*space/.test(n)) return "open_space";
  if (/bureau|office/.test(n)) return "bureau";
  if (/entree|hall.*entree/.test(n)) return "entree";
  if (/dressing/.test(n)) return "dressing";
  if (/cellier|buanderie|laundry/.test(n)) return "cellier";
  if (/terrasse|balcon|loggia/.test(n)) return "terrasse";
  if (/garage|parking/.test(n)) return "garage";
  if (/accueil|reception/.test(n)) return "accueil";
  if (/local.*tech|technique/.test(n)) return "local_technique";
  if (/couloir|degagement|palier/.test(n)) return "couloir";
  if (/cave|cellier|rangement|buanderie|local.*technique|technique|archive|stockage/.test(n)) return "cave";
  return "autre";
}

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
  // Extraction runs AFTER lot definition (lots_defined) or on retry (extraction_failed)
  if (project.status !== "lots_defined" && project.status !== "extraction_failed") {
    return NextResponse.json(
      {
        error: "INVALID_STATUS",
        message: "L'extraction nécessite que les lots soient définis d'abord.",
      },
      { status: 409 }
    );
  }

  // ─── Rate limit: 3 extractions/projet ──────────────────────────
  if (!checkRateLimit("extract", projectId, 3, 3600_000)) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT",
        message: "Maximum 3 extractions par projet. Contactez le support si besoin.",
      },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  try {
    // ─── Load plan(s) from Object Storage ─────────────────────────
    if (!project.plan_file_path) {
      return NextResponse.json(
        { error: "PLAN_REQUIRED", message: "Aucun plan trouvé pour ce projet." },
        { status: 400 }
      );
    }

    // plan_file_path can be a single path or JSON array of paths (multi-file)
    let planPaths: string[];
    let planMimeTypes: string[];
    try {
      const parsed = JSON.parse(project.plan_file_path);
      if (Array.isArray(parsed)) {
        planPaths = parsed;
        // plan_mime_type is also a JSON array when multi-file
        const mimes = project.plan_mime_type ? JSON.parse(project.plan_mime_type) : [];
        planMimeTypes = Array.isArray(mimes)
          ? mimes
          : planPaths.map(() => project.plan_mime_type || "image/jpeg");
      } else {
        planPaths = [project.plan_file_path];
        planMimeTypes = [project.plan_mime_type || "image/jpeg"];
      }
    } catch (parseErr) {
      // Not JSON — single path string
      console.warn(
        `[extract] plan_file_path JSON parse failed for project ${projectId}, treating as single path:`,
        parseErr instanceof Error ? parseErr.message : parseErr,
        `| raw value: "${project.plan_file_path?.slice(0, 200)}"`
      );
      planPaths = [project.plan_file_path];
      planMimeTypes = [project.plan_mime_type || "image/jpeg"];
    }

    // Download all plans from Object Storage
    const planInputs: Array<{ base64: string; mimeType: string; floorIndex: number }> = [];

    for (let i = 0; i < planPaths.length; i++) {
      const path = planPaths[i];
      let planBuffer: Buffer = Buffer.alloc(0);
      await withStorageRetry(async (client) => {
        const result = await client.downloadAsBytes(path);
        // SDK returns { ok, value: [Buffer] } — value is a TUPLE, not a Buffer directly
        if (result.ok && result.value) {
          const buf = result.value[0];
          if (buf) {
            planBuffer = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
          }
        }
      }, `downloadPlan(${path})`);

      if (planBuffer.length === 0) {
        console.warn(`[extract] Plan file empty or unreadable: ${path}`);
        continue;
      }

      // Validate and normalize MIME type before passing to extractor
      const VALID_EXTRACTION_MIMES = new Set([
        "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf",
      ]);
      let mimeType = planMimeTypes[i] || "";
      if (!mimeType || !VALID_EXTRACTION_MIMES.has(mimeType)) {
        console.warn(
          `[extract] Invalid or missing MIME type "${mimeType}" for plan ${i} of project ${projectId}, falling back to image/jpeg`
        );
        mimeType = "image/jpeg";
      }

      planInputs.push({
        base64: planBuffer.toString("base64"),
        mimeType,
        floorIndex: i,
      });
    }

    if (planInputs.length === 0) {
      return NextResponse.json(
        {
          error: "PLAN_UNREADABLE",
          message: "Impossible de lire le(s) plan(s). Réuploadez-les au format JPG, PNG ou PDF.",
        },
        { status: 422 }
      );
    }

    // ─── Call extraction IA + sanitize + quality gates ──────────
    let rawResult = await extractMultiplePlans(
      planInputs,
      project.type_bien as TypeBien
    );

    // Sanitize surfaces (10x correction, cm→m, cap per typeBien)
    let sanitized = sanitizeSurfaces(rawResult, project.type_bien);
    let extractionResult = sanitized.data;

    // Quality gates with sanitization log for explicit warnings
    let qualityReport = validateExtraction(extractionResult, sanitized.log, project.type_bien);
    console.log(`[extract] Quality score: ${qualityReport.score}/100, gates: ${qualityReport.gates.filter(g => g.passed).length}/${qualityReport.gates.length}, shouldRetry: ${qualityReport.shouldRetry}, sanitized: ${sanitized.log.length} corrections`);

    // Auto-retry ONCE if critical gates fail — with contextual feedback
    if (qualityReport.shouldRetry) {
      // Build retry context from failed gates + sanitization warnings
      const failedGates = qualityReport.gates
        .filter((g) => !g.passed)
        .map((g) => `- ${g.id}: ${g.detail || g.label}`)
        .join("\n");
      const retryContext = failedGates
        ? `Quality gate failures:\n${failedGates}`
        : undefined;

      console.warn(`[extract] Quality gates failed — retrying with context: ${retryContext?.substring(0, 200)}`);
      try {
        rawResult = await extractMultiplePlans(
          planInputs,
          project.type_bien as TypeBien,
          retryContext
        );
        sanitized = sanitizeSurfaces(rawResult, project.type_bien);
        extractionResult = sanitized.data;
        qualityReport = validateExtraction(extractionResult, sanitized.log, project.type_bien);
        console.log(`[extract] Retry quality score: ${qualityReport.score}/100`);
      } catch (retryErr) {
        console.error(`[extract] Retry failed:`, retryErr);
      }
    }

    if (extractionResult.rooms.length === 0) {
      // Mark project as extraction_failed
      const db = getPool();
      await db.query(
        `UPDATE pro_projects SET status = 'extraction_failed', updated_at = NOW() WHERE id = $1`,
        [projectId]
      );
      return NextResponse.json(
        {
          status: "extraction_failed",
          reason: "NO_ROOMS_DETECTED",
          message: "Aucune pièce détectée sur le plan. Vérifiez la qualité de l'image.",
        },
        { status: 422 }
      );
    }

    // ─── Save extraction data + rooms in DB ───────────────────────
    const db = getPool();

    // Archive raw extraction in project
    await db.query(
      `UPDATE pro_projects
       SET extraction_data = $1, status = 'extraction_done', updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(extractionResult), projectId]
    );

    // Insert rooms
    const insertedRooms: Array<{
      id: string;
      name: string;
      room_type: string;
      surface_m2: number | null;
      length_m: number | null;
      width_m: number | null;
      floor_index: number;
      confidence: number;
      bounding_box?: { x_percent: number; y_percent: number; width_percent: number; height_percent: number } | null;
    }> = [];

    for (const room of extractionResult.rooms) {
      const insertResult = await db.query(
        `INSERT INTO pro_rooms (
          project_id, name, room_type, surface_m2,
          length_m, width_m, ceiling_height_m,
          windows_count, doors_count, floor, shape,
          is_estimated, confidence, source, bounding_box
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, name, room_type, surface_m2, length_m, width_m, floor, confidence, bounding_box`,
        [
          projectId,
          room.name_raw,
          inferRoomType(room.name_raw),
          room.surface_m2,
          room.dimensions?.length_m ?? null,
          room.dimensions?.width_m ?? null,
          room.ceiling_height_m,
          room.windows_count,
          room.doors_count,
          room.floor ?? 0,
          room.shape,
          room.surface_m2 !== null && room.dimensions === null, // is_estimated
          room.confidence,
          "ai_extraction",
          room.bounding_box ? JSON.stringify(room.bounding_box) : null,
        ]
      );
      const row = insertResult.rows[0];
      insertedRooms.push({
        id: row.id,
        name: row.name,
        room_type: row.room_type,
        surface_m2: row.surface_m2 !== null ? Number(row.surface_m2) : null,
        length_m: row.length_m !== null && row.length_m !== undefined ? Number(row.length_m) : null,
        width_m: row.width_m !== null && row.width_m !== undefined ? Number(row.width_m) : null,
        floor_index: row.floor ?? 0,
        confidence: typeof row.confidence === "number" ? row.confidence : room.confidence,
        bounding_box: row.bounding_box ?? room.bounding_box ?? null,
      });
    }

    // ─── Auto-assign rooms to lots by zone containment ──────────
    // Lots are defined BEFORE extraction — load them and assign rooms
    // based on bounding_box center being inside lot zone_rect
    const lotsResult = await db.query(
      `SELECT id, zone_rect FROM pro_lots WHERE project_id = $1 ORDER BY sort_order`,
      [projectId]
    );
    const projectLots = lotsResult.rows as Array<{
      id: string;
      zone_rect: { x_percent: number; y_percent: number; width_percent: number; height_percent: number } | null;
    }>;

    if (projectLots.length > 0) {
      // Lots with zones for spatial assignment
      const lotsWithZones = projectLots.filter((l) => l.zone_rect);

      for (const room of insertedRooms) {
        let assignedLotId: string | null = null;

        if (room.bounding_box && lotsWithZones.length > 0) {
          // Compute room center
          const cx = room.bounding_box.x_percent + room.bounding_box.width_percent / 2;
          const cy = room.bounding_box.y_percent + room.bounding_box.height_percent / 2;

          // Find the lot whose zone contains this room's center (smallest zone wins tiebreaker)
          let bestArea = Infinity;
          for (const lot of lotsWithZones) {
            const z = lot.zone_rect!;
            if (
              cx >= z.x_percent &&
              cx <= z.x_percent + z.width_percent &&
              cy >= z.y_percent &&
              cy <= z.y_percent + z.height_percent
            ) {
              const area = z.width_percent * z.height_percent;
              if (area < bestArea) {
                bestArea = area;
                assignedLotId = lot.id;
              }
            }
          }
        }

        // Fallback: assign to first lot if no zone match (single-lot projects)
        if (!assignedLotId && projectLots.length === 1) {
          assignedLotId = projectLots[0].id;
        }

        if (assignedLotId) {
          await db.query(
            `UPDATE pro_rooms SET lot_id = $1 WHERE id = $2`,
            [assignedLotId, room.id]
          );
        }
      }
    }

    console.log(
      `[POST /api/pro/projects/${projectId}/extract] Extracted ${insertedRooms.length} rooms`
    );

    return NextResponse.json({
      status: "extraction_done",
      rooms_count: insertedRooms.length,
      rooms: insertedRooms,
      building_outline: extractionResult.building_outline ?? null,
      quality: {
        score: qualityReport.score,
        warnings: qualityReport.warnings,
        gates_passed: qualityReport.gates.filter((g) => g.passed).length,
        gates_total: qualityReport.gates.length,
      },
    });
  } catch (err) {
    console.error(`[POST /api/pro/projects/${projectId}/extract] Error:`, err);

    // Mark as failed
    try {
      const db = getPool();
      await db.query(
        `UPDATE pro_projects SET status = 'extraction_failed', updated_at = NOW() WHERE id = $1`,
        [projectId]
      );
    } catch {
      // Swallow DB error in error handler
    }

    // Provide specific error messages based on the error type
    let userMessage = "Erreur lors de l'extraction. Réessayez ou uploadez une image (JPG, PNG) du plan.";
    let reason: string = "API_ERROR";

    if (err instanceof PlanExtractionError) {
      reason = err.reason;
      switch (err.reason) {
        case "API_ERROR":
          userMessage = err.message; // Already user-friendly from plan-extractor
          break;
        case "PARSING_FAILED":
          userMessage = "L'IA n'a pas pu interpréter ce plan. Essayez avec une image plus nette ou un autre format.";
          break;
        case "PLAN_UNREADABLE":
          userMessage = "Le plan est illisible. Vérifiez la qualité du fichier et réessayez.";
          break;
        case "NO_ROOMS_DETECTED":
          userMessage = "Aucune pièce détectée. Vérifiez que le fichier contient bien un plan architectural.";
          break;
      }
    }

    return NextResponse.json(
      {
        status: "extraction_failed",
        reason,
        message: userMessage,
      },
      { status: 500 }
    );
  }
}
