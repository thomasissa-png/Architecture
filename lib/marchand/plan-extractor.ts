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
  typeBien: TypeBien
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
    rawJson = await callVisionExtraction(openai, systemPrompt, imageDataUrl);
  } catch (err) {
    // Retry once after 5s on API error
    console.warn(
      "[plan-extractor] First attempt failed, retrying in 5s...",
      err instanceof Error ? err.message : err
    );
    await sleep(5000);
    try {
      rawJson = await callVisionExtraction(openai, systemPrompt, imageDataUrl);
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
    return sanitizeSurfaces(validation.data);
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
      return sanitizeSurfaces(correctedValidation.data);
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
  typeBien: TypeBien
): Promise<PlanExtractionResult> {
  if (plans.length === 0) {
    throw new PlanExtractionError("PLAN_UNREADABLE", "Aucun plan fourni.");
  }

  // Single plan — no merge needed
  if (plans.length === 1) {
    return extractPlanData(plans[0].base64, plans[0].mimeType, typeBien);
  }

  const allRooms: PlanExtractionResult["rooms"] = [];
  const allWarnings: Set<string> = new Set();
  let totalSurface = 0;
  let hasAnySurface = false;
  let scaleRef: PlanExtractionResult["scale_reference"] = "none";

  // Process each plan sequentially (avoid rate limits)
  for (const plan of plans) {
    console.log(`[plan-extractor] Extracting floor ${plan.floorIndex} (${plan.mimeType})`);

    const result = await extractPlanData(plan.base64, plan.mimeType, typeBien);

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
/**
 * Fix obviously wrong surfaces that GPT may have produced.
 * Common errors: 10x factor (reading "25.8" as 258 then computing wrong),
 * cm read as m, cotes assigned to wrong room.
 */
function sanitizeSurfaces(data: PlanExtractionResult): PlanExtractionResult {
  const rooms = [...data.rooms];
  let totalSurface = data.total_surface_m2;

  // ── Fix 0: Detect systematic 10x error ──────────────────────────
  // If the MEDIAN surface is > 50m², ALL surfaces are likely ~10x too large.
  // This is the most common GPT misread pattern (25.8m² → 258 → /10 correction).
  const validSurfaces = rooms.filter((r) => r.surface_m2 !== null).map((r) => r.surface_m2!).sort((a, b) => a - b);
  if (validSurfaces.length >= 2) {
    const median = validSurfaces[Math.floor(validSurfaces.length / 2)];
    if (median > 50) {
      console.warn(`[plan-extractor] Median surface ${median}m² > 50m² — systematic 10x error detected, dividing all surfaces by 10`);
      for (const room of rooms) {
        if (room.surface_m2 !== null) {
          room.surface_m2 = Math.round(room.surface_m2 * 10) / 100; // divide by 10, round to 1 decimal
        }
        if (room.dimensions) {
          room.dimensions.length_m = Math.round(room.dimensions.length_m * 100 / Math.sqrt(10)) / 100;
          room.dimensions.width_m = Math.round(room.dimensions.width_m * 100 / Math.sqrt(10)) / 100;
        }
        room.confidence = Math.min(room.confidence, 0.5);
      }
      if (totalSurface !== null) {
        totalSurface = Math.round(totalSurface * 10) / 100;
      }
    }
  }

  // ── Fix 1: Individual room dimension checks ─────────────────────
  for (const room of rooms) {
    if (room.surface_m2 === null) continue;

    // If dimensions look like centimeters (length or width > 50m), convert
    if (room.dimensions) {
      let fixed = false;
      if (room.dimensions.length_m > 50) {
        room.dimensions.length_m = room.dimensions.length_m / 100;
        fixed = true;
      }
      if (room.dimensions.width_m > 50) {
        room.dimensions.width_m = room.dimensions.width_m / 100;
        fixed = true;
      }
      if (fixed) {
        room.surface_m2 = Math.round(room.dimensions.length_m * room.dimensions.width_m * 100) / 100;
        room.confidence = Math.min(room.confidence, 0.5);
        console.warn(`[plan-extractor] Sanitized dimensions for "${room.name_raw}" (cm→m): ${room.surface_m2}m²`);
      }
    }

    // Cap individual rooms at 80m² (standard residential max)
    if (room.surface_m2 > 80) {
      console.warn(`[plan-extractor] Room "${room.name_raw}" surface ${room.surface_m2}m² > 80m² — capping to null`);
      room.surface_m2 = null;
      room.dimensions = null;
      room.confidence = Math.min(room.confidence, 0.3);
    }

    // If a single room is larger than total surface, it's wrong
    if (totalSurface !== null && room.surface_m2 !== null && room.surface_m2 > totalSurface) {
      console.warn(`[plan-extractor] Room "${room.name_raw}" ${room.surface_m2}m² exceeds total ${totalSurface}m² — capping`);
      room.surface_m2 = null;
      room.dimensions = null;
      room.confidence = Math.min(room.confidence, 0.3);
    }
  }

  // ── Fix 2: Recalculate total if needed ──────────────────────────
  const sumSurfaces = rooms.reduce((s, r) => s + (r.surface_m2 ?? 0), 0);
  let correctedTotal = totalSurface;
  if (correctedTotal === null || (sumSurfaces > 0 && Math.abs(sumSurfaces - (correctedTotal ?? 0)) > sumSurfaces * 0.3)) {
    correctedTotal = Math.round(sumSurfaces * 100) / 100;
  }

  return {
    ...data,
    rooms,
    total_surface_m2: correctedTotal,
  };
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
  imageDataUrl: string
): Promise<string> {
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
            text: "Extract all rooms from this floor plan. Return the JSON only.",
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
