/**
 * Extraction de plan via GPT-4.1 vision.
 *
 * Source de vérité : docs/marchand-pivot/ia/technical-architecture.md sections 1.1 et 4.1.
 * Envoie le plan (image base64) à GPT-4.1 vision via openai.responses.create,
 * retourne un JSON validé par le schema Zod PlanExtractionResult.
 */
import OpenAI from "openai";
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

// ─── System prompt ──────────────────────────────────────────────────
function buildSystemPrompt(typeBien: TypeBien): string {
  return `You are an expert architectural floor plan analyzer. Your job is to extract structured data from a floor plan image (photograph, scan, or CAD export).

TASK: Analyze this floor plan and return a JSON object listing every room with its properties.

EXTRACTION RULES:
1. ROOM IDENTIFICATION: Identify every enclosed space. Include living rooms, bedrooms, kitchens, bathrooms, toilets, offices, hallways, storage, cellars. Exclude outdoor spaces (balconies, terraces) unless they are enclosed.
2. DIMENSIONS: Read all dimension annotations (cotes) on the plan. If dimensions are printed in centimeters, convert to meters. If no dimensions are readable, set dimensions to null and add "no_dimensions_found" to warnings.
3. SURFACE ESTIMATION: If dimensions are available, calculate surface = length x width. If dimensions are null, estimate surface from the relative proportions of rooms using the door as scale reference (standard French door = 83cm wide).
4. SCALE REFERENCE: Report which scale reference you used: "dimensions_on_plan" if cotes are readable, "door_standard_83cm" if you estimated from door width, "scale_bar" if a graphical scale is present, "none" if no reference was available.
5. WINDOWS & DOORS: Count windows (typically thin parallel lines on exterior walls) and doors (arcs or gaps in walls) for each room.
6. FLOOR DETECTION: If the plan shows multiple floors or levels, set the floor number for each room (0 = ground floor). If single level, all rooms are floor 0.
7. CONFIDENCE: Rate your confidence 0-1 for each room. Lower confidence for: rooms partially occluded, dimensions estimated (not read), ambiguous room function.
8. IGNORE: Electrical symbols, plumbing symbols, dimension arrows (just read the numbers), furniture drawn on plan, north arrow, title block.

TYPE DE BIEN CONTEXT: This plan is for a "${typeBien}". If "immeuble", there may be multiple units — identify them if possible.

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
          },
          required: [
            "temp_id", "name_raw", "surface_m2", "dimensions",
            "ceiling_height_m", "windows_count", "doors_count",
            "floor", "confidence", "shape", "notes",
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

  // Map MIME type to OpenAI-compatible format
  const mediaType = mimeType.startsWith("image/")
    ? (mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
    : "image/jpeg"; // Fallback for PDF-rendered images

  const dataUrl = `data:${mediaType};base64,${planBase64}`;

  // First attempt
  let rawJson: string;
  try {
    rawJson = await callVisionExtraction(openai, systemPrompt, dataUrl);
  } catch (err) {
    // Retry once after 5s on API error
    console.warn(
      "[plan-extractor] First attempt failed, retrying in 5s...",
      err instanceof Error ? err.message : err
    );
    await sleep(5000);
    try {
      rawJson = await callVisionExtraction(openai, systemPrompt, dataUrl);
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
      dataUrl,
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

// ─── Internal helpers ───────────────────────────────────────────────

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
    ],
    text: {
      format: {
        type: "json_schema",
        ...PLAN_EXTRACTION_JSON_SCHEMA,
      },
    },
  });

  // Extract text output from response
  const textOutput = response.output.find((o) => o.type === "message");
  if (!textOutput || textOutput.type !== "message") {
    throw new Error("No message output from GPT-4.1 vision");
  }
  const textContent = textOutput.content.find((c) => c.type === "output_text");
  if (!textContent || textContent.type !== "output_text") {
    throw new Error("No text content in GPT-4.1 vision response");
  }
  return textContent.text;
}

async function callSelfCorrection(
  openai: OpenAI,
  systemPrompt: string,
  imageDataUrl: string,
  previousJson: string,
  zodErrors: string
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
            text: `Your previous output had validation errors. Fix them and return valid JSON.\n\nPrevious output:\n${previousJson}\n\nValidation errors:\n${zodErrors}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        ...PLAN_EXTRACTION_JSON_SCHEMA,
      },
    },
  });

  const textOutput = response.output.find((o) => o.type === "message");
  if (!textOutput || textOutput.type !== "message") {
    throw new Error("No message output from self-correction");
  }
  const textContent = textOutput.content.find((c) => c.type === "output_text");
  if (!textContent || textContent.type !== "output_text") {
    throw new Error("No text content in self-correction response");
  }
  return textContent.text;
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
