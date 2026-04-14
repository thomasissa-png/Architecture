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
  plan_index: number;
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

    // Load plan image(s) for vision analysis
    if (!project.plan_file_path) {
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    // Parse all plan paths from the stored value (single string or JSON array)
    let allPlanPaths: string[] = [];
    try {
      if (project.plan_file_path.startsWith("[")) {
        const parsed = JSON.parse(project.plan_file_path);
        allPlanPaths = Array.isArray(parsed) ? (parsed as string[]) : [project.plan_file_path];
      } else {
        allPlanPaths = [project.plan_file_path];
      }
    } catch {
      allPlanPaths = [project.plan_file_path];
    }

    // For PDFs, use the preview PNG
    allPlanPaths = allPlanPaths.map((p) =>
      p.toLowerCase().endsWith(".pdf") ? `${p}-preview.png` : p
    );

    // Load ALL plan images from Object Storage
    const planLabels = allPlanPaths.length === 1
      ? [""]
      : allPlanPaths.map((_, i) => {
          // Floor label: 0 = RDC, 1 = Étage 1, etc.
          return i === 0 ? "RDC" : `Étage ${i}`;
        });

    const imageBase64List: { base64: string; label: string }[] = [];
    for (let i = 0; i < allPlanPaths.length; i++) {
      const planPath = allPlanPaths[i];
      try {
        const imageBuffer = await withStorageRetry(async (storage) => {
          const result = await storage.downloadAsBytes(planPath);
          if (!result.ok || !result.value) throw new Error("Download failed");
          const buf = result.value[0];
          return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
        }, `downloadPlan(${planPath})`);
        imageBase64List.push({
          base64: imageBuffer.toString("base64"),
          label: planLabels[i],
        });
      } catch {
        console.warn(`[detect] Could not load plan image: ${planPath}`);
        // Skip this plan — continue with the others
      }
    }

    // If no plan images could be loaded, fallback
    if (imageBase64List.length === 0) {
      return NextResponse.json({
        lots: [{ lot_name: "Lot 1", lot_type: "appartement", room_ids: [], zone_rect: null }],
        source: "fallback",
      });
    }

    const openai = new OpenAI({ apiKey, timeout: 30000 });

    const totalPlans = imageBase64List.length;
    const multiPlanInstructions = totalPlans > 1
      ? `
You are looking at ${totalPlans} floor plan images representing DIFFERENT FLOORS of the same building.
Each image is labeled "Plan X/${totalPlans} (floor name)".
Units/lots can span multiple floors (e.g. a duplex) or be on a single floor.
When identifying lots, specify which plan(s)/floor(s) each lot is on.
The zone bounding box for each lot refers to the plan image where that lot is primarily located.
Add a "plan_index" field (0-based) to each lot indicating which plan image the zone_rect refers to.`
      : `You are looking at a single floor plan image.`;

    const systemPrompt = `You are an expert real estate analyst. ${multiPlanInstructions}

Your job is to identify how many separate residential/commercial units (lots/biens) are visible, AND locate each unit spatially on its plan image.

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

CRITICAL: You MUST provide a "zone" bounding box for EVERY lot. Never return zone as null.
If you see only one unit, the zone should cover the entire building footprint on the plan.
If you see multiple units, divide the plan area so each unit gets its own non-overlapping zone.
Estimate as best you can — an approximate zone is far better than no zone.

Return a JSON object with this exact structure:
{
  "lots": [
    {
      "lot_name": "string (descriptive name in French)",
      "lot_type": "appartement" | "commerce" | "bureau" | "parking" | "autre",
      "plan_index": 0,
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

    // Build multi-image content blocks
    const userContentBlocks: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" } }
    > = [];

    if (totalPlans > 1) {
      userContentBlocks.push({
        type: "text",
        text: `Analyze these ${totalPlans} floor plans of the same building. How many separate units/lots do you see across all floors? Propose a division.`,
      });
    } else {
      userContentBlocks.push({
        type: "text",
        text: "Analyze this floor plan. How many separate units/lots do you see? Propose a division.",
      });
    }

    for (let i = 0; i < imageBase64List.length; i++) {
      const { base64, label } = imageBase64List[i];
      if (totalPlans > 1) {
        userContentBlocks.push({
          type: "text",
          text: `Plan ${i + 1}/${totalPlans} (${label}):`,
        });
      }
      userContentBlocks.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${base64}`,
          detail: "high",
        },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: userContentBlocks,
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
    let parsed: { lots?: Array<{ lot_name: string; lot_type?: string; plan_index?: number; zone?: { x_percent?: number; y_percent?: number; width_percent?: number; height_percent?: number } }> };
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

      // plan_index: which plan image the zone refers to (0-based, default 0)
      const planIndex = typeof lot.plan_index === "number"
        ? Math.max(0, Math.min(lot.plan_index, totalPlans - 1))
        : 0;

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
        plan_index: planIndex,
      };
    });

    // ─── Fallback: compute zones for lots that have none ─────────
    // If GPT didn't return zone data, divide the plan evenly among lots
    const lotsWithoutZone = validatedLots.filter((l) => !l.zone_rect);
    if (lotsWithoutZone.length > 0 && lotsWithoutZone.length === validatedLots.length) {
      // No lots have zones — divide the plan horizontally among all lots
      const count = validatedLots.length;
      const margin = 2; // 2% margin from edges
      const availableWidth = 100 - 2 * margin;
      const lotWidth = availableWidth / count;
      for (let i = 0; i < validatedLots.length; i++) {
        validatedLots[i].zone_rect = {
          x_percent: margin + i * lotWidth,
          y_percent: margin,
          width_percent: lotWidth,
          height_percent: 100 - 2 * margin,
        };
      }
      console.log(`[detect] Computed fallback zones for ${count} lots (no zone data from AI)`);
    } else if (lotsWithoutZone.length > 0) {
      // Some lots have zones, some don't — fill in the gaps
      // Find the bounding box of existing zones and assign remaining space
      for (const lot of lotsWithoutZone) {
        lot.zone_rect = {
          x_percent: 5,
          y_percent: 5,
          width_percent: 90,
          height_percent: 90,
        };
      }
      console.log(`[detect] Computed fallback zones for ${lotsWithoutZone.length}/${validatedLots.length} lots missing zone data`);
    }

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
