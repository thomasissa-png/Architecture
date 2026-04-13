/**
 * POST /api/pro/projects/:id/lots/detect — Détection IA des lots/biens
 *
 * Rendu : SSR (force-dynamic) — appel IA + données utilisateur.
 *
 * Analyse les pièces extraites et propose une répartition en lots.
 * Utilise GPT-4.1 vision pour détecter les unités résidentielles.
 * Fallback : 1 lot = toutes les pièces si détection échoue.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import {
  ensureProTables,
  getRoomsByProject,
} from "@/lib/marchand/db";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

/** Lot type values accepted by the database. */
type LotType = "appartement" | "commerce" | "bureau" | "parking" | "autre";

const VALID_LOT_TYPES: LotType[] = ["appartement", "commerce", "bureau", "parking", "autre"];

interface DetectedLot {
  lot_name: string;
  lot_type: LotType;
  room_ids: string[];
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

  try {
    await ensureProTables();

    // ─── Load rooms ──────────────────────────────────────────────
    const rooms = await getRoomsByProject(projectId);
    if (rooms.length === 0) {
      return NextResponse.json(
        { error: "NO_ROOMS", message: "Aucune pièce extraite pour ce projet." },
        { status: 400 }
      );
    }

    // ─── Build room summary for the AI ───────────────────────────
    const roomsSummary = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      room_type: r.room_type,
      floor: r.floor,
      surface_m2: r.surface_m2,
    }));

    // ─── Try IA detection ────────────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "..." || apiKey.startsWith("sk_test_")) {
      // No valid API key — fallback to single lot
      return NextResponse.json({
        lots: buildFallbackLots(rooms.map((r) => r.id), roomsSummary),
        source: "fallback",
      });
    }

    const openai = new OpenAI({ apiKey, timeout: 10000 });

    const systemPrompt = `You are an expert real estate analyst. Analyze the list of rooms extracted from a floor plan and propose how to divide them into separate residential/commercial units (lots).

Rules:
- Look for patterns indicating separate units: multiple entrances, separate bathrooms per group, logical spatial grouping by floor
- A typical apartment has: entrance + kitchen + bathroom + bedroom(s)
- A commercial space typically has: a large open area, no bedrooms, is on the ground floor (floor 0)
- If rooms are on different floors and there is no clear multi-floor unit, group by floor
- If you cannot determine separate units, return a single lot containing all rooms
- Each room must be assigned to exactly one lot
- Lot names should be descriptive in French: "T2 RDC", "T3 Étage 1", "Commerce RDC", etc.

Return a JSON object with this exact structure:
{
  "lots": [
    {
      "lot_name": "string",
      "lot_type": "appartement" | "commerce" | "bureau" | "parking" | "autre",
      "room_ids": ["room-uuid-1", "room-uuid-2"]
    }
  ]
}`;

    const userPrompt = `Here are the rooms extracted from the floor plan:

${JSON.stringify(roomsSummary, null, 2)}

Propose a division into lots/units. Every room ID must appear in exactly one lot.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({
        lots: buildFallbackLots(rooms.map((r) => r.id), roomsSummary),
        source: "fallback",
      });
    }

    // ─── Parse and validate response ─────────────────────────────
    let parsed: { lots?: DetectedLot[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({
        lots: buildFallbackLots(rooms.map((r) => r.id), roomsSummary),
        source: "fallback",
      });
    }

    if (!parsed.lots || !Array.isArray(parsed.lots) || parsed.lots.length === 0) {
      return NextResponse.json({
        lots: buildFallbackLots(rooms.map((r) => r.id), roomsSummary),
        source: "fallback",
      });
    }

    // Validate that all room IDs are valid and every room is assigned
    const allRoomIds = new Set(rooms.map((r) => r.id));
    const assignedIds = new Set<string>();
    const validatedLots: DetectedLot[] = [];

    for (const lot of parsed.lots) {
      const validRoomIds = (lot.room_ids || []).filter((id) => {
        if (allRoomIds.has(id) && !assignedIds.has(id)) {
          assignedIds.add(id);
          return true;
        }
        return false;
      });

      if (validRoomIds.length > 0) {
        const lotType = VALID_LOT_TYPES.includes(lot.lot_type as LotType)
          ? (lot.lot_type as LotType)
          : "appartement";
        validatedLots.push({
          lot_name: lot.lot_name || `Lot ${validatedLots.length + 1}`,
          lot_type: lotType,
          room_ids: validRoomIds,
        });
      }
    }

    // Any unassigned rooms go into a catch-all lot
    const unassigned = rooms.filter((r) => !assignedIds.has(r.id)).map((r) => r.id);
    if (unassigned.length > 0) {
      if (validatedLots.length === 1) {
        // Single lot — just add them
        validatedLots[0].room_ids.push(...unassigned);
      } else {
        validatedLots.push({
          lot_name: `Lot ${validatedLots.length + 1}`,
          lot_type: "appartement",
          room_ids: unassigned,
        });
      }
    }

    // If somehow we ended up with 0 lots, fallback
    if (validatedLots.length === 0) {
      return NextResponse.json({
        lots: buildFallbackLots(rooms.map((r) => r.id), roomsSummary),
        source: "fallback",
      });
    }

    return NextResponse.json({
      lots: validatedLots,
      source: "ai",
    });
  } catch (err) {
    console.error(`[POST /api/pro/projects/${projectId}/lots/detect] Error:`, err);

    // On any error, return fallback — don't block the user
    try {
      const rooms = await getRoomsByProject(projectId);
      return NextResponse.json({
        lots: buildFallbackLots(
          rooms.map((r) => r.id),
          rooms.map((r) => ({ id: r.id, name: r.name, room_type: r.room_type, floor: r.floor, surface_m2: r.surface_m2 }))
        ),
        source: "fallback",
      });
    } catch {
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Erreur lors de la détection des lots." },
        { status: 500 }
      );
    }
  }
}

// ─── Fallback: group by floor or single lot ─────────────────────────

function buildFallbackLots(
  allRoomIds: string[],
  roomsSummary: Array<{ id: string; name: string; room_type: string; floor: number; surface_m2: number | null }>
): DetectedLot[] {
  // Group rooms by floor
  const byFloor = new Map<number, string[]>();
  for (const room of roomsSummary) {
    const floor = room.floor ?? 0;
    if (!byFloor.has(floor)) byFloor.set(floor, []);
    byFloor.get(floor)!.push(room.id);
  }

  // If only 1 floor, single lot
  if (byFloor.size <= 1) {
    return [{
      lot_name: "Lot 1",
      lot_type: "appartement",
      room_ids: allRoomIds,
    }];
  }

  // Multiple floors — 1 lot per floor
  const lots: DetectedLot[] = [];
  const sortedFloors = Array.from(byFloor.entries()).sort(([a], [b]) => a - b);
  for (const [floor, roomIds] of sortedFloors) {
    lots.push({
      lot_name: floor === 0 ? "RDC" : `Étage ${floor}`,
      lot_type: "appartement",
      room_ids: roomIds,
    });
  }

  return lots;
}
