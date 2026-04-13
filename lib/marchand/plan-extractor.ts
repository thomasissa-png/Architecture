/**
 * Extraction de plan via GPT-4.1 vision.
 *
 * Source de vérité : docs/marchand-pivot/ia/technical-architecture.md sections 1.1 et 4.1.
 *
 * PDF handling: les PDF sont convertis en PNG via pdf-to-img (pdfjs-dist) AVANT
 * l'envoi à GPT-4.1 vision. Cela garantit que le même pipeline est utilisé pour
 * tous les formats (images ET PDF). Plus besoin de GPT-4o ni de Files API.
 *
 * Multi-fichier : `extractMultiplePlans()` traite un tableau de plans (1 par étage)
 * et fusionne les résultats avec floor auto-incrémenté.
 */
import OpenAI from "openai";
import { pdf } from "pdf-to-img";
import {
  PlanExtractionResultSchema,
  type PlanExtractionResult,
  type TypeBien,
} from "@/lib/marchand/schemas";

// ─── Singleton OpenAI client ────────────────────────────────────────
let _openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiClient;
}

// ─── PDF detection ─────────────────────────────────────────────────
/**
 * Detect if a base64-encoded file is a PDF.
 * Checks MIME type first, then magic bytes (%PDF- = JVBERi0 in base64).
 */
function isPdf(mimeType: string, base64Data: string): boolean {
  if (mimeType === "application/pdf") return true;
  return base64Data.startsWith("JVBERi0");
}

// ─── System prompt ──────────────────────────────────────────────────
function buildSystemPrompt(typeBien: TypeBien): string {
  return `You are an expert architectural floor plan analyzer. Your job is to extract structured data from a floor plan image (photograph, scan, or CAD export).

TASK: Analyze this floor plan and return a JSON object listing every room with its properties.

STEP 1 — IDENTIFY THE BUILDING OUTLINE:
Before looking at individual rooms, identify the EXTERIOR WALLS of the building on this plan. Note the approximate rectangle they form as a percentage of the full image. ALL rooms MUST be placed INSIDE this outline. Nothing can be outside the building walls.

STEP 2 — IDENTIFY EVERY ROOM:
Identify every enclosed space: living rooms, bedrooms, kitchens, bathrooms, toilets, offices, hallways, storage, cellars. Exclude outdoor spaces (balconies, terraces) unless enclosed.

STEP 3 — READ SURFACES (PRIORITY ORDER):
For each room, determine surface_m2 using this priority:
  A. FIRST: Look for surface values WRITTEN DIRECTLY on the plan (e.g., "25.8 m²", "12.3", "S=8.5m²"). These are the MOST RELIABLE. Use them AS-IS. This is by far the most common format on French architectural plans.
  B. SECOND: If no surface is written but LENGTH × WIDTH dimensions are readable, calculate surface_m2 = length_m × width_m. Dimensions are in METERS. If values seem > 50, they are in centimeters — divide by 100.
  C. LAST RESORT: If nothing is readable, estimate from relative room proportions using door width as reference (standard French door = 83cm).

SANITY CHECK on every surface:
  - WC: 1–4 m²  |  Salle de bain: 3–15 m²  |  Chambre: 8–25 m²
  - Cuisine: 5–25 m²  |  Salon/séjour: 15–60 m²  |  Couloir/entrée: 2–15 m²
  - If a surface is OUTSIDE these ranges, you MISREAD it. Look again at the plan.
  - The sum of all rooms on one floor CANNOT exceed 200 m² for a typical apartment.
  - No single room can be > 60 m² in a standard residential building.

STEP 4 — BOUNDING BOXES (follow the walls):
  - x_percent, y_percent = top-left corner of the room (0-100% of image width/height).
  - width_percent, height_percent = room size relative to full image.
  - TRACE THE WALLS: each box must align with the interior walls visible on the plan.
  - The building outline you identified in STEP 1 is the ABSOLUTE BOUNDARY — no room extends beyond it.
  - Adjacent rooms share walls → their bounding boxes must be ADJACENT (touching), never overlapping.
  - Box SIZE must be proportional to surface_m2 — a 3m² WC is MUCH smaller than a 25m² séjour.
  - x_percent + width_percent <= 100. y_percent + height_percent <= 100.

STEP 5 — METADATA:
  - WINDOWS & DOORS: Count windows and doors for each room.
  - FLOOR: If multiple levels visible, set floor (0 = RDC). Otherwise all rooms = floor 0.
  - CONFIDENCE: 0-1. Lower if surface was estimated or room function is ambiguous.
  - SCALE REFERENCE: "dimensions_on_plan" if cotes/surfaces readable, "door_standard_83cm" if estimated, "scale_bar" if graphical scale present, "none" otherwise.
  - IGNORE: Electrical symbols, plumbing, furniture, north arrow, title block.

STEP 6 — SELF-REVIEW (mandatory before returning):
  Ask yourself these questions and FIX any issues:
  1. Does each room's surface_m2 match what is WRITTEN on the plan? If the plan says "25.8 m²" and I have 241 m², I made an error.
  2. Is any room larger than 60 m²? If yes, re-read the plan — I likely misread a dimension or surface.
  3. Does the sum of all surfaces make sense for a ${typeBien}? A typical apartment floor is 40-120 m² total.
  4. Are ALL bounding boxes INSIDE the building outline? If a room is outside the walls, I placed it wrong.
  5. Do bounding boxes follow the visible wall lines? If not, adjust to match the walls.
  6. Are small rooms (WC, SDB) smaller than large rooms (séjour) in both surface AND bounding box?

TYPE DE BIEN: "${typeBien}". If "immeuble", there may be multiple units — identify them if possible.

OUTPUT: Return valid JSON matching the provided schema. French room names. No commentary outside the JSON.`;
}

// ─── JSON Schema for structured output ──────────────────────────────
// OpenAI response_format requires a JSON Schema (not Zod).
// Hand-written to match PlanExtractionResultSchema exactly.
const PLAN_EXTRACTION_JSON_SCHEMA = {
  name: "plan_extraction",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      rooms: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            temp_id: { type: "string" as const },
            name_raw: { type: "string" as const },
            surface_m2: { type: ["number", "null"] as const },
            dimensions: {
              anyOf: [
                {
                  type: "object" as const,
                  properties: {
                    length_m: { type: "number" as const },
                    width_m: { type: "number" as const },
                  },
                  required: ["length_m", "width_m"],
                  additionalProperties: false,
                },
                { type: "null" as const },
              ],
            },
            ceiling_height_m: { type: ["number", "null"] as const },
            windows_count: { type: "integer" as const },
            doors_count: { type: "integer" as const },
            floor: { type: ["integer", "null"] as const },
            confidence: { type: "number" as const },
            shape: {
              anyOf: [
                { type: "string" as const, enum: ["rectangular", "square", "L-shaped", "narrow_corridor", "irregular"] },
                { type: "null" as const },
              ],
            },
            notes: { type: ["string", "null"] as const },
            bounding_box: {
              anyOf: [
                {
                  type: "object" as const,
                  properties: {
                    x_percent: { type: "number" as const },
                    y_percent: { type: "number" as const },
                    width_percent: { type: "number" as const },
                    height_percent: { type: "number" as const },
                  },
                  required: ["x_percent", "y_percent", "width_percent", "height_percent"],
                  additionalProperties: false,
                },
                { type: "null" as const },
              ],
            },
          },
          required: [
            "temp_id", "name_raw", "surface_m2", "dimensions",
            "ceiling_height_m", "windows_count", "doors_count",
            "floor", "confidence", "shape", "notes", "bounding_box",
          ],
          additionalProperties: false,
        },
      },
      total_surface_m2: { type: ["number", "null"] as const },
      floors_count: { type: "integer" as const },
      extraction_warnings: {
        type: "array" as const,
        items: {
          type: "string" as const,
          enum: [
            "no_dimensions_found",
            "low_resolution",
            "partial_occlusion",
            "no_scale_reference",
            "technical_symbols_ignored",
          ],
        },
      },
      scale_reference: {
        type: "string" as const,
        enum: ["dimensions_on_plan", "door_standard_83cm", "scale_bar", "none"],
      },
    },
    required: ["rooms", "total_surface_m2", "floors_count", "extraction_warnings", "scale_reference"],
    additionalProperties: false,
  },
};

// ─── Main extraction function ───────────────────────────────────────

/**
 * Extract structured room data from a floor plan image using GPT-4.1 vision.
 *
 * @param planBase64 - Base64-encoded plan image
 * @param mimeType - MIME type of the image (image/jpeg, image/png, application/pdf)
 * @param typeBien - Type of property for context
 * @returns Validated PlanExtractionResult
 * @throws Error with typed message on failure
 */
export async function extractPlanData(
  planBase64: string,
  mimeType: string,
  typeBien: TypeBien,
  retryContext?: string
): Promise<PlanExtractionResult> {
  const openai = getOpenAI();
  const systemPrompt = buildSystemPrompt(typeBien);

  // If PDF, convert to PNG first — same pipeline for all formats
  let imageBase64 = planBase64;
  let imageMimeType = mimeType;

  if (isPdf(mimeType, planBase64)) {
    console.log("[plan-extractor] PDF detected — converting to PNG via pdf-to-img...");
    try {
      const pdfBuffer = Buffer.from(planBase64, "base64");
      const pages = await pdf(pdfBuffer, { scale: 2 });
      for await (const page of pages) {
        // Use first page only (multi-page handled by extractMultiplePlans)
        imageBase64 = Buffer.from(page).toString("base64");
        imageMimeType = "image/png";
        console.log(`[plan-extractor] PDF→PNG conversion OK: ${page.length} bytes`);
        break;
      }
    } catch (convErr) {
      console.error("[plan-extractor] PDF→PNG conversion failed:", convErr);
      throw new PlanExtractionError(
        "API_ERROR",
        "Impossible de lire ce PDF. Vérifiez qu'il n'est pas protégé par mot de passe. Vous pouvez aussi réessayer en uploadant une image (JPG, PNG) du plan."
      );
    }
  }

  const imageDataUrl = buildImageDataUrl(imageMimeType, imageBase64);

  // First attempt
  let rawJson: string;
  try {
    rawJson = await callVisionExtraction(openai, systemPrompt, imageDataUrl, retryContext);
  } catch (err) {
    // Retry once after 5s on API error
    console.warn(
      "[plan-extractor] First attempt failed, retrying in 5s...",
      err instanceof Error ? err.message : err
    );
    await sleep(5000);
    try {
      rawJson = await callVisionExtraction(openai, systemPrompt, imageDataUrl, retryContext);
    } catch (retryErr) {
      throw new PlanExtractionError(
        "API_ERROR",
        `Extraction failed after retry: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`
      );
    }
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new PlanExtractionError("PARSING_FAILED", "Model returned invalid JSON");
  }

  // Validate with Zod
  const validation = PlanExtractionResultSchema.safeParse(parsed);
  if (validation.success) {
    return validation.data;
  }

  // Self-correction: send Zod errors back to the model for a second try
  console.warn(
    "[plan-extractor] Zod validation failed, attempting self-correction...",
    validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
  );

  try {
    const correctedJson = await callSelfCorrection(
      openai,
      systemPrompt,
      imageDataUrl,
      rawJson,
      validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n")
    );
    const correctedParsed = JSON.parse(correctedJson);
    const correctedValidation = PlanExtractionResultSchema.safeParse(correctedParsed);
    if (correctedValidation.success) {
      return correctedValidation.data;
    }
    throw new PlanExtractionError(
      "PARSING_FAILED",
      `Self-correction failed: ${correctedValidation.error.issues.map((i) => i.message).join(", ")}`
    );
  } catch (err) {
    if (err instanceof PlanExtractionError) throw err;
    throw new PlanExtractionError(
      "PARSING_FAILED",
      `Self-correction error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ─── Multi-plan extraction ─────────────────────────────────────────

interface PlanInput {
  base64: string;
  mimeType: string;
  /** Floor index override (0 = RDC, 1 = 1er étage, etc.) */
  floorIndex: number;
}

/**
 * Extract rooms from multiple plan files (1 per floor/étage).
 * Results are merged with floor numbers auto-assigned from the floorIndex of each plan.
 * Processes plans sequentially to avoid hitting OpenAI rate limits.
 */
export async function extractMultiplePlans(
  plans: PlanInput[],
  typeBien: TypeBien,
  retryContext?: string
): Promise<PlanExtractionResult> {
  if (plans.length === 0) {
    throw new PlanExtractionError("PLAN_UNREADABLE", "Aucun plan fourni.");
  }

  // Single plan — no merge needed
  if (plans.length === 1) {
    return extractPlanData(plans[0].base64, plans[0].mimeType, typeBien, retryContext);
  }

  const allRooms: PlanExtractionResult["rooms"] = [];
  const allWarnings: Set<string> = new Set();
  let totalSurface = 0;
  let hasAnySurface = false;
  let scaleRef: PlanExtractionResult["scale_reference"] = "none";

  // Process each plan sequentially (avoid rate limits)
  for (const plan of plans) {
    console.log(`[plan-extractor] Extracting floor ${plan.floorIndex} (${plan.mimeType})`);

    const result = await extractPlanData(plan.base64, plan.mimeType, typeBien, retryContext);

    // Override floor number for each room to match the plan's floor index
    for (const room of result.rooms) {
      allRooms.push({
        ...room,
        floor: plan.floorIndex,
        temp_id: `f${plan.floorIndex}_${room.temp_id}`,
      });
    }

    // Merge warnings
    for (const w of result.extraction_warnings) {
      allWarnings.add(w);
    }

    // Accumulate surface
    if (result.total_surface_m2 !== null) {
      totalSurface += result.total_surface_m2;
      hasAnySurface = true;
    }

    // Keep the best scale reference
    if (result.scale_reference !== "none") {
      scaleRef = result.scale_reference;
    }
  }

  return {
    rooms: allRooms,
    total_surface_m2: hasAnySurface ? totalSurface : null,
    floors_count: plans.length,
    extraction_warnings: Array.from(allWarnings) as PlanExtractionResult["extraction_warnings"],
    scale_reference: scaleRef,
  };
}

// ─── Surface sanity checks (post-extraction) ──────────────────────

export interface SanitizationEntry {
  room: string;
  from: number | null;
  to: number | null;
  reason: string;
}

interface SanitizeResult {
  data: PlanExtractionResult;
  log: SanitizationEntry[];
}

/**
 * Fix obviously wrong surfaces. Returns corrected data + a log of all changes
 * so validateExtraction can produce user-facing warnings.
 */
export function sanitizeSurfaces(data: PlanExtractionResult, typeBien?: string): SanitizeResult {
  const rooms = [...data.rooms];
  let totalSurface = data.total_surface_m2;
  const log: SanitizationEntry[] = [];

  // Global max surface per room depends on type de bien
  const globalMaxRoom = typeBien === "maison" ? 150 : typeBien === "immeuble" || typeBien === "local_commercial" ? 250 : 80;

  // ── Room-type specific max surfaces (generous but catch absurdities) ─
  const ROOM_TYPE_MAX: Record<string, number> = {
    wc: 8, sdb: 20, chambre: 35, cuisine: 40, salon: 80,
    bureau: 30, couloir: 25, cave: 40, autre: 60,
  };
  // Min surface per room type (to validate /10 corrections)
  const ROOM_TYPE_MIN: Record<string, number> = {
    wc: 0.5, sdb: 2, chambre: 5, cuisine: 3, salon: 8,
    bureau: 3, couloir: 1, cave: 1, autre: 1,
  };

  // ── Fix 0: Detect systematic 10x error (global median check) ─────
  const validSurfaces = rooms.filter((r) => r.surface_m2 !== null).map((r) => r.surface_m2!).sort((a, b) => a - b);
  if (validSurfaces.length >= 2) {
    const median = validSurfaces[Math.floor(validSurfaces.length / 2)];
    if (median > globalMaxRoom) {
      console.warn(`[plan-extractor] Median surface ${median}m² > ${globalMaxRoom}m² — systematic 10x error, dividing all by 10`);
      for (const room of rooms) {
        if (room.surface_m2 !== null) {
          const before = room.surface_m2;
          room.surface_m2 = Math.round(room.surface_m2 * 10) / 100;
          log.push({ room: room.name_raw, from: before, to: room.surface_m2, reason: "10x_correction" });
        }
        if (room.dimensions) {
          room.dimensions.length_m = Math.round(room.dimensions.length_m / Math.sqrt(10) * 100) / 100;
          room.dimensions.width_m = Math.round(room.dimensions.width_m / Math.sqrt(10) * 100) / 100;
        }
        room.confidence = Math.min(room.confidence, 0.5);
      }
      if (totalSurface !== null) {
        totalSurface = Math.round(totalSurface * 10) / 100;
      }
    }
  }

  // ── Fix 0b: Per-room-type 10x detection (catches mixed errors) ───
  // When some rooms are correct but others are 10x inflated (e.g. WC=3m² OK but Chambre=131m²)
  for (const room of rooms) {
    if (room.surface_m2 === null) continue;
    const rType = inferRoomTypeFromName(room.name_raw);
    const maxForType = ROOM_TYPE_MAX[rType] ?? ROOM_TYPE_MAX.autre;
    const minForType = ROOM_TYPE_MIN[rType] ?? ROOM_TYPE_MIN.autre;
    // Allow 20% margin above the type max before flagging
    if (room.surface_m2 > maxForType * 1.2) {
      const divided = Math.round(room.surface_m2 * 10) / 100;
      if (divided >= minForType && divided <= maxForType * 1.2) {
        // /10 gives a reasonable value → apply correction
        const before = room.surface_m2;
        room.surface_m2 = divided;
        room.confidence = Math.min(room.confidence, 0.5);
        if (room.dimensions) {
          room.dimensions.length_m = Math.round(room.dimensions.length_m / Math.sqrt(10) * 100) / 100;
          room.dimensions.width_m = Math.round(room.dimensions.width_m / Math.sqrt(10) * 100) / 100;
        }
        log.push({ room: room.name_raw, from: before, to: room.surface_m2, reason: "10x_per_type" });
      }
    }
  }

  // ── Fix 1: Individual room checks ─────────────────────────────
  for (const room of rooms) {
    if (room.surface_m2 === null) continue;

    // cm→m conversion
    if (room.dimensions) {
      let fixed = false;
      if (room.dimensions.length_m > 50) { room.dimensions.length_m /= 100; fixed = true; }
      if (room.dimensions.width_m > 50) { room.dimensions.width_m /= 100; fixed = true; }
      if (fixed) {
        const before = room.surface_m2;
        room.surface_m2 = Math.round(room.dimensions.length_m * room.dimensions.width_m * 100) / 100;
        room.confidence = Math.min(room.confidence, 0.5);
        log.push({ room: room.name_raw, from: before, to: room.surface_m2, reason: "cm_to_m" });
      }
    }

    // Per-room-type cap (after 10x correction attempts)
    const rType = inferRoomTypeFromName(room.name_raw);
    const maxForType = ROOM_TYPE_MAX[rType] ?? ROOM_TYPE_MAX.autre;
    if (room.surface_m2 > maxForType * 1.2) {
      log.push({ room: room.name_raw, from: room.surface_m2, to: null, reason: `cap_type_${rType}_${maxForType}m2` });
      room.surface_m2 = null;
      room.dimensions = null;
      room.confidence = Math.min(room.confidence, 0.3);
    }

    // Global cap per typeBien (safety net)
    if (room.surface_m2 !== null && room.surface_m2 > globalMaxRoom) {
      log.push({ room: room.name_raw, from: room.surface_m2, to: null, reason: `cap_${globalMaxRoom}m2` });
      room.surface_m2 = null;
      room.dimensions = null;
      room.confidence = Math.min(room.confidence, 0.3);
    }

    // Room > total
    if (totalSurface !== null && room.surface_m2 !== null && room.surface_m2 > totalSurface) {
      log.push({ room: room.name_raw, from: room.surface_m2, to: null, reason: "exceeds_total" });
      room.surface_m2 = null;
      room.dimensions = null;
      room.confidence = Math.min(room.confidence, 0.3);
    }
  }

  // ── Fix 2: Clamp bounding boxes to image bounds ────────────────
  for (const room of rooms) {
    if (!room.bounding_box) continue;
    const bb = room.bounding_box;
    bb.x_percent = Math.max(0, Math.min(bb.x_percent, 99));
    bb.y_percent = Math.max(0, Math.min(bb.y_percent, 99));
    bb.width_percent = Math.max(1, Math.min(bb.width_percent, 100 - bb.x_percent));
    bb.height_percent = Math.max(1, Math.min(bb.height_percent, 100 - bb.y_percent));
    // No single room should take more than 60% of plan in either direction
    if (bb.width_percent > 60) {
      bb.width_percent = 60;
      log.push({ room: room.name_raw, from: null, to: null, reason: "bbox_width_clamped" });
    }
    if (bb.height_percent > 60) {
      bb.height_percent = 60;
      log.push({ room: room.name_raw, from: null, to: null, reason: "bbox_height_clamped" });
    }
  }

  // ── Fix 3: Recalculate total ──────────────────────────────────
  const sumSurfaces = rooms.reduce((s, r) => s + (r.surface_m2 ?? 0), 0);
  let correctedTotal = totalSurface;
  if (correctedTotal === null || (sumSurfaces > 0 && Math.abs(sumSurfaces - (correctedTotal ?? 0)) > sumSurfaces * 0.3)) {
    correctedTotal = Math.round(sumSurfaces * 100) / 100;
  }

  return {
    data: { ...data, rooms, total_surface_m2: correctedTotal },
    log,
  };
}

/** Infer room type from name_raw for surface caps */
function inferRoomTypeFromName(nameRaw: string): string {
  const n = nameRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/salon|sejour|living|salle.*manger/.test(n)) return "salon";
  if (/cuisine|kitchen|kitchenette/.test(n)) return "cuisine";
  if (/chambre|bedroom/.test(n)) return "chambre";
  if (/salle.*bain|sdb|bathroom/.test(n)) return "sdb";
  if (/\bwc\b|toilet/.test(n)) return "wc";
  if (/bureau|office/.test(n)) return "bureau";
  if (/couloir|hall|entree|degagement|palier/.test(n)) return "couloir";
  if (/cave|cellier|rangement|buanderie/.test(n)) return "cave";
  return "autre";
}

// ─── Quality gates (post-extraction, post-sanitization) ────────────

export interface ExtractionQualityGate {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ExtractionQualityReport {
  score: number; // 0-100
  gates: ExtractionQualityGate[];
  warnings: string[]; // User-facing FR warnings
  shouldRetry: boolean; // If true, extraction quality is too low — auto-retry recommended
}

/**
 * Validate extraction quality BEFORE displaying to user.
 * Accepts optional sanitization log to produce explicit warnings per room.
 * Accepts typeBien for context-dependent thresholds.
 */
export function validateExtraction(
  data: PlanExtractionResult,
  sanitizationLog?: SanitizationEntry[],
  typeBien?: string
): ExtractionQualityReport {
  const gates: ExtractionQualityGate[] = [];
  const warnings: string[] = [];

  // C1: Convert sanitization log to explicit user warnings
  if (sanitizationLog && sanitizationLog.length > 0) {
    for (const entry of sanitizationLog) {
      if (entry.reason === "10x_correction") {
        warnings.push(`${entry.room} : surface corrigée de ${entry.from}m² → ${entry.to}m² (erreur de lecture détectée).`);
      } else if (entry.reason.startsWith("cap_")) {
        warnings.push(`${entry.room} : surface de ${entry.from}m² aberrante, supprimée. Saisissez-la manuellement.`);
      } else if (entry.reason === "exceeds_total") {
        warnings.push(`${entry.room} : surface de ${entry.from}m² dépasse le total, supprimée.`);
      } else if (entry.reason === "cm_to_m") {
        warnings.push(`${entry.room} : dimensions converties cm→m (${entry.from}m² → ${entry.to}m²).`);
      }
    }
  }

  // C2: Thresholds depend on typeBien
  const maxTotalSurface = typeBien === "maison" ? 500 : typeBien === "immeuble" || typeBien === "local_commercial" ? 800 : 300;

  // Per-room-type max (same as sanitizeSurfaces)
  const RT_MAX: Record<string, number> = {
    wc: 8, sdb: 20, chambre: 35, cuisine: 40, salon: 80,
    bureau: 30, couloir: 25, cave: 40, autre: 60,
  };

  // GATE 1 — Surfaces in realistic ranges per room type
  const oversizedRooms = data.rooms.filter((r) => {
    if (r.surface_m2 === null) return false;
    const rType = inferRoomTypeFromName(r.name_raw);
    const max = RT_MAX[rType] ?? RT_MAX.autre;
    return r.surface_m2 > max * 1.2;
  });
  gates.push({
    id: "G1_SURFACE_RANGE",
    label: "Surfaces dans les plages réalistes par type de pièce",
    passed: oversizedRooms.length === 0,
    detail: oversizedRooms.length > 0
      ? oversizedRooms.map((r) => `${r.name_raw} (${r.surface_m2}m²)`).join(", ")
      : undefined,
  });
  if (oversizedRooms.length > 0) {
    for (const r of oversizedRooms) {
      warnings.push(`${r.name_raw} : ${r.surface_m2}m² semble trop grand. Vérifiez cette surface.`);
    }
  }

  // GATE 2 — Total surface coherent
  const totalSurface = data.rooms.reduce((s, r) => s + (r.surface_m2 ?? 0), 0);
  const totalOk = totalSurface > 0 && totalSurface < maxTotalSurface;
  gates.push({
    id: "G2_TOTAL_SURFACE",
    label: `Surface totale cohérente (< ${maxTotalSurface}m²)`,
    passed: totalOk,
    detail: !totalOk ? `Surface totale : ${totalSurface.toFixed(1)}m²` : undefined,
  });
  if (!totalOk && totalSurface >= maxTotalSurface) {
    warnings.push(`Surface totale de ${totalSurface.toFixed(1)}m² — semble trop grande.`);
  }

  // GATE 3 — Bounding boxes within image bounds (strict 100%, no tolerance)
  const outOfBounds = data.rooms.filter((r) => {
    if (!r.bounding_box) return false;
    const bb = r.bounding_box;
    return bb.x_percent < 0 || bb.y_percent < 0
      || bb.x_percent + bb.width_percent > 100
      || bb.y_percent + bb.height_percent > 100;
  });
  gates.push({
    id: "G3_BBOX_IN_BOUNDS",
    label: "Pièces dans les limites du plan",
    passed: outOfBounds.length === 0,
    detail: outOfBounds.length > 0 ? outOfBounds.map((r) => r.name_raw).join(", ") : undefined,
  });
  if (outOfBounds.length > 0) {
    warnings.push(`${outOfBounds.length} pièce(s) hors du plan : ${outOfBounds.map((r) => r.name_raw).join(", ")}. Repositionnez-les.`);
  }

  // GATE 4 — Bounding boxes not empty (C3: warning FR)
  const emptyBoxes = data.rooms.filter((r) => {
    if (!r.bounding_box) return true;
    return r.bounding_box.width_percent < 1 || r.bounding_box.height_percent < 1;
  });
  gates.push({
    id: "G4_BBOX_NOT_EMPTY",
    label: "Toutes les pièces ont une position",
    passed: emptyBoxes.length === 0,
    detail: emptyBoxes.length > 0 ? `${emptyBoxes.length} pièce(s) sans position` : undefined,
  });
  if (emptyBoxes.length > 0) {
    warnings.push(`${emptyBoxes.length} pièce(s) sans position sur le plan. Repositionnez-les manuellement.`);
  }

  // GATE 5 — Bounding box sizes proportional to surfaces (C3: warning FR)
  const roomsWithBoth = data.rooms.filter((r) => r.surface_m2 !== null && r.bounding_box);
  let proportionalOk = true;
  if (roomsWithBoth.length >= 2) {
    const surfaceMin = Math.min(...roomsWithBoth.map((r) => r.surface_m2!));
    const surfaceMax = Math.max(...roomsWithBoth.map((r) => r.surface_m2!));
    const bboxMin = Math.min(...roomsWithBoth.map((r) => r.bounding_box!.width_percent * r.bounding_box!.height_percent));
    const bboxMax = Math.max(...roomsWithBoth.map((r) => r.bounding_box!.width_percent * r.bounding_box!.height_percent));
    if (surfaceMax > surfaceMin * 3 && bboxMax > 0 && bboxMin > 0) {
      const bboxRatio = bboxMax / bboxMin;
      const surfaceRatio = surfaceMax / surfaceMin;
      proportionalOk = bboxRatio > surfaceRatio * 0.2;
    }
  }
  gates.push({
    id: "G5_BBOX_PROPORTIONAL",
    label: "Tailles visuelles proportionnelles aux surfaces",
    passed: proportionalOk,
    detail: !proportionalOk ? "Les tailles visuelles ne correspondent pas aux surfaces" : undefined,
  });
  if (!proportionalOk) {
    warnings.push("Les tailles visuelles des pièces ne semblent pas proportionnelles aux surfaces. Vérifiez le positionnement.");
  }

  // GATE 6 — At least 2 rooms detected
  gates.push({
    id: "G6_MIN_ROOMS",
    label: "Au moins 2 pièces détectées",
    passed: data.rooms.length >= 2,
    detail: data.rooms.length < 2 ? `Seulement ${data.rooms.length} pièce(s)` : undefined,
  });
  if (data.rooms.length < 2) {
    warnings.push("Très peu de pièces détectées. Le plan est peut-être illisible.");
  }

  // GATE 7 — No duplicate rooms (C5: by bbox overlap only, name not required)
  let duplicates = 0;
  for (let i = 0; i < data.rooms.length; i++) {
    for (let j = i + 1; j < data.rooms.length; j++) {
      const a = data.rooms[i];
      const b = data.rooms[j];
      if (a.bounding_box && b.bounding_box) {
        const overlap = Math.abs(a.bounding_box.x_percent - b.bounding_box.x_percent) < 5
          && Math.abs(a.bounding_box.y_percent - b.bounding_box.y_percent) < 5
          && a.bounding_box.width_percent > 0 && b.bounding_box.width_percent > 0;
        if (overlap) duplicates++;
      }
    }
  }
  gates.push({
    id: "G7_NO_DUPLICATES",
    label: "Pas de pièces en double",
    passed: duplicates === 0,
    detail: duplicates > 0 ? `${duplicates} doublon(s) détecté(s)` : undefined,
  });
  if (duplicates > 0) {
    warnings.push(`${duplicates} pièce(s) semblent en double (même position). Supprimez les doublons.`);
  }

  // GATE 8 — C6: At least 50% of rooms have a surface (not all null)
  const roomsWithSurface = data.rooms.filter((r) => r.surface_m2 !== null).length;
  const surfaceCoverage = data.rooms.length > 0 ? roomsWithSurface / data.rooms.length : 0;
  gates.push({
    id: "G8_SURFACE_COVERAGE",
    label: "Surfaces détectées sur la majorité des pièces",
    passed: surfaceCoverage >= 0.5,
    detail: surfaceCoverage < 0.5 ? `${roomsWithSurface}/${data.rooms.length} pièces avec surface` : undefined,
  });
  if (surfaceCoverage < 0.5) {
    warnings.push("La majorité des surfaces n'ont pas pu être lues. Saisissez-les manuellement.");
  }

  // ── Score calculation ──────────────────────────────────────────
  const passedCount = gates.filter((g) => g.passed).length;
  const score = Math.round((passedCount / gates.length) * 100);

  // Should retry if critical gates fail (surfaces, total, bbox, or min rooms)
  const criticalGateIds = new Set(["G1_SURFACE_RANGE", "G2_TOTAL_SURFACE", "G3_BBOX_IN_BOUNDS", "G6_MIN_ROOMS"]);
  const criticalFails = gates.filter((g) => !g.passed && criticalGateIds.has(g.id));
  const shouldRetry = criticalFails.length > 0;

  return { score, gates, warnings, shouldRetry };
}

// ─── Internal helpers ───────────────────────────────────────────────

/**
 * Build a data URL for image content.
 */
function buildImageDataUrl(mimeType: string, base64Data: string): string {
  const mediaType = mimeType.startsWith("image/")
    ? mimeType
    : "image/jpeg";
  return `data:${mediaType};base64,${base64Data}`;
}

/**
 * Extract text from the OpenAI Responses API output.
 */
function extractTextFromResponse(response: { output: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }, label: string): string {
  const textOutput = response.output.find((o) => o.type === "message");
  if (!textOutput || textOutput.type !== "message") {
    throw new Error(`No message output from ${label}`);
  }
  const msg = textOutput as { type: "message"; content: Array<{ type: string; text?: string }> };
  const textContent = msg.content.find((c) => c.type === "output_text");
  if (!textContent || textContent.type !== "output_text" || !textContent.text) {
    throw new Error(`No text content in ${label} response`);
  }
  return textContent.text;
}

/**
 * Call GPT-4.1 vision for image-based plan extraction.
 */
async function callVisionExtraction(
  openai: OpenAI,
  systemPrompt: string,
  imageDataUrl: string,
  retryContext?: string
): Promise<string> {
  const userText = retryContext
    ? `Extract all rooms from this floor plan. Return the JSON only.\n\nIMPORTANT — Previous extraction had these errors:\n${retryContext}\nFix these issues in your new extraction.`
    : "Extract all rooms from this floor plan. Return the JSON only.";

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: imageDataUrl,
            detail: "high",
          },
          {
            type: "input_text",
            text: userText,
          },
        ],
      },
    ] as unknown as Parameters<typeof openai.responses.create>[0]["input"],
    text: {
      format: {
        type: "json_schema",
        ...PLAN_EXTRACTION_JSON_SCHEMA,
      },
    },
  });

  return extractTextFromResponse(response as unknown as { output: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }, "GPT-4.1 vision");
}

/**
 * Self-correction: send Zod validation errors back to the model for a fixed output.
 * Always uses GPT-4.1 vision (PDFs are already converted to PNG upstream).
 */
async function callSelfCorrection(
  openai: OpenAI,
  systemPrompt: string,
  imageDataUrl: string,
  previousJson: string,
  zodErrors: string
): Promise<string> {
  const correctionText = `Your previous output had validation errors. Fix them and return valid JSON.\n\nPrevious output:\n${previousJson}\n\nValidation errors:\n${zodErrors}`;

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: imageDataUrl,
            detail: "high",
          },
          {
            type: "input_text",
            text: correctionText,
          },
        ],
      },
    ] as unknown as Parameters<typeof openai.responses.create>[0]["input"],
    text: {
      format: {
        type: "json_schema",
        ...PLAN_EXTRACTION_JSON_SCHEMA,
      },
    },
  });

  return extractTextFromResponse(response as unknown as { output: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }, "self-correction");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Error class ────────────────────────────────────────────────────

export type PlanExtractionErrorReason =
  | "API_ERROR"
  | "PARSING_FAILED"
  | "PLAN_UNREADABLE"
  | "NO_ROOMS_DETECTED";

export class PlanExtractionError extends Error {
  reason: PlanExtractionErrorReason;

  constructor(reason: PlanExtractionErrorReason, message: string) {
    super(message);
    this.name = "PlanExtractionError";
    this.reason = reason;
  }
}
