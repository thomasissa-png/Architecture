/**
 * POST /api/pro/projects/:id/lots/detect — Détection IA des lots/biens
 *
 * Rendu : SSR (force-dynamic) — appel IA + données utilisateur.
 *
 * Analyse l'image du plan pour proposer une répartition en lots/biens.
 * Utilise GPT-4.1 vision pour détecter les unités résidentielles.
 * Fallback : 1 lot si détection échoue.
 *
 * NOTE : cette route fonctionne SANS pièces extraites.
 * L'extraction des pièces se fait APRÈS la définition des lots.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables } from "@/lib/marchand/db";
import { withStorageRetry } from "@/lib/db";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

/** Lot type values accepted by the database. */
type LotType = "appartement" | "commerce" | "bureau" | "parking" | "autre";

const VALID_LOT_TYPES: LotType[] = ["appartement", "commerce", "bureau", "parking", "autre"];

/** Clamp a numeric value to the 0-100 range. Returns 0 for non-finite inputs. */
function clampPercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

interface ZoneRect {
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
}

interface DetectedLot {
  lot_name: string;
  lot_type: LotType;
  room_ids: string[];
  zone_rect: ZoneRect | null;
}

// ─── POST handler ──────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ───────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  const { project } = authResult;

  // ─── Status guard — detection only before extraction ───────────
  const validStatuses = ["plan_uploaded", "lots_defined"];
  if (!validStatuses.includes(project.status)) {
    return NextResponse.json(
      {
        error: "INVALID_STATUS",
        message: "La détection des lots n'est possible qu'avant l'extraction.",
      },
      { status: 409 }
    );
  }

  try {
    await ensureProTables();

    // ─── Try IA detection from plan image ────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "..." || apiKey.startsWith("sk_test_")) {
      // No valid API key — fallback to single lot
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    // Load plan image for vision analysis
    if (!project.plan_file_path) {
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    // Get the first plan image path
    let firstPath = project.plan_file_path;
    try {
      if (firstPath.startsWith("[")) {
        const parsed = JSON.parse(firstPath);
        firstPath = Array.isArray(parsed) ? parsed[0] : firstPath;
      }
    } catch { /* use raw path */ }

    // For PDFs, use the preview PNG
    if (firstPath.endsWith(".pdf")) firstPath = firstPath + "-preview.png";

    // Load image from Object Storage
    let imageBase64: string | null = null;
    try {
      const imageBuffer = await withStorageRetry(async (storage) => {
        const result = await storage.downloadAsBytes(firstPath);
        if (!result.ok || !result.value) throw new Error("Download failed");
        const buf = result.value[0];
        return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
      }, `downloadPlan(${firstPath})`);
      imageBase64 = imageBuffer.toString("base64");
    } catch {
      // Can't load plan image — fallback
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    const openai = new OpenAI({ apiKey, timeout: 30000 });

    const systemPrompt = `You are an expert real estate analyst. You are looking at a floor plan image. Your job is to identify how many separate residential/commercial units (lots/biens) are visible on this plan, AND locate each unit spatially on the image.

Rules:
- Look for patterns indicating separate units: multiple entrances, separate staircases, dividing walls, apartment numbers
- A typical apartment has: entrance + kitchen + bathroom + bedroom(s)
- A commercial space typically has: a large open area, no bedrooms, is on the ground floor
- If the plan shows only ONE unit (single apartment, single house), return 1 lot
- If you see multiple units on the plan, return one lot per unit
- Each lot should have a descriptive French name: "T2 RDC", "T3 Étage 1", "Commerce RDC", etc.
- If you cannot clearly determine separate units, return a single lot

Spatial zone (bounding box) rules:
- For EACH lot, provide a "zone" object with its bounding box as percentages of the full image.
- Coordinate system: (0, 0) = top-left corner of the image, (100, 100) = bottom-right corner.
- x_percent: horizontal position of the left edge of the zone (0 = left edge of image).
- y_percent: vertical position of the top edge of the zone (0 = top edge of image).
- width_percent: width of the zone as a percentage of the total image width.
- height_percent: height of the zone as a percentage of the total image height.
- All values must be between 0 and 100. x_percent + width_percent must not exceed 100. y_percent + height_percent must not exceed 100.
- Zones must NOT overlap each other. Each lot occupies a distinct area of the plan.
- Draw the zone tightly around the unit's walls/boundaries visible on the plan.

Return a JSON object with this exact structure:
{
  "lots": [
    {
      "lot_name": "string (descriptive name in French)",
      "lot_type": "appartement" | "commerce" | "bureau" | "parking" | "autre",
      "zone": {
        "x_percent": 5,
        "y_percent": 10,
        "width_percent": 45,
        "height_percent": 80
      }
    }
  ],
  "reasoning": "Brief explanation of why you identified these lots"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this floor plan. How many separate units/lots do you see? Propose a division.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    // ─── Parse and validate response ─────────────────────────────
    let parsed: { lots?: Array<{ lot_name: string; lot_type?: string; zone?: { x_percent?: number; y_percent?: number; width_percent?: number; height_percent?: number } }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    if (!parsed.lots || !Array.isArray(parsed.lots) || parsed.lots.length === 0) {
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    // Build validated lots (no room_ids at this stage — rooms don't exist yet)
    const validatedLots: DetectedLot[] = parsed.lots.map((lot, i) => {
      const lotType = VALID_LOT_TYPES.includes(lot.lot_type as LotType)
        ? (lot.lot_type as LotType)
        : "appartement";

      // Parse and clamp zone bounding box (0-100 range)
      let zoneRect: ZoneRect | null = null;
      if (lot.zone && typeof lot.zone === "object") {
        const x = clampPercent(lot.zone.x_percent);
        const y = clampPercent(lot.zone.y_percent);
        const w = clampPercent(lot.zone.width_percent);
        const h = clampPercent(lot.zone.height_percent);
        // Only accept if dimensions are positive and within bounds
        if (w > 0 && h > 0) {
          zoneRect = {
            x_percent: x,
            y_percent: y,
            width_percent: Math.min(w, 100 - x),
            height_percent: Math.min(h, 100 - y),
          };
        }
      }

      return {
        lot_name: lot.lot_name || `Lot ${i + 1}`,
        lot_type: lotType,
        room_ids: [], // No rooms yet — extraction happens after lot definition
        zone_rect: zoneRect,
      };
    });

    return NextResponse.json({
      lots: validatedLots,
      source: "ai",
    });
  } catch (err) {
    console.error(`[POST /api/pro/projects/${projectId}/lots/detect] Error:`, err);

    return NextResponse.json({
      lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
      source: "fallback",
    });
  }
}
