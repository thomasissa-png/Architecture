import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";
import { logGeneration, savePass1Cache, getPass1Cache } from "@/lib/db";
import { preprocessIterationComment } from "@/lib/custom-prompt";
import {
  buildIterationFurnitureResponsesPrompt,
  buildIterationFurnitureFluxPrompt,
  FLUX_ITERATION_NEGATIVE_PROMPT,
  MAX_ITERATIONS,
  PASS1_TTL_MS,
} from "@/lib/iteration-prompt";
import { applyRoomTypeOverrides } from "@/lib/room-types";
import { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } from "@/lib/outdoor-subtypes";
import {
  buildIterationOutdoorFurnitureResponsesPrompt,
  buildIterationOutdoorFurnitureFluxPrompt,
} from "@/lib/iteration-prompt";

// ─── Rate Limiting (in-memory, IP-based) ────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ─── Output Size (preserve input aspect ratio) ──────────────────────
// Maps input dimensions to the closest OpenAI-compatible size.
// OpenAI image_generation supports: 1024x1024, 1536x1024, 1024x1536
function getOutputSize(
  width?: number,
  height?: number
): { openai: string; w: number; h: number } {
  if (!width || !height) {
    return { openai: "1024x1024", w: 1024, h: 1024 };
  }
  const ratio = width / height;
  if (ratio > 1.3) return { openai: "1536x1024", w: 1536, h: 1024 }; // landscape
  if (ratio < 0.77) return { openai: "1024x1536", w: 1024, h: 1536 }; // portrait
  return { openai: "1024x1024", w: 1024, h: 1024 }; // square-ish
}

// ─── Prompt Engineering ──────────────────────────────────────────────
//
// PIPELINE 2 PASSES with SPLIT PROMPTS:
// Pass 1 (surfaces): Uses surfacePrompt — wall color, floor finish, ceiling, fixture ONLY.
// Pass 2 (furniture): Uses furniturePrompt — freestanding objects ONLY.
//
// RULES:
// - NO lighting directives in style prompts (preserve input light)
// - NO curtains/drapes (hallucination risk)
// - NO structural modifications beyond surface finish
// - surfacePrompt: color/finish of walls, floor, ceiling + ceiling fixture
// - furniturePrompt: freestanding objects with precise silhouettes + scale

// ── Pass 1: Surface finishing ────────────────────────────────────────
function buildSurfacesResponsesPrompt(surfacePrompt: string): string {
  return [
    "Edit this photo of a room.",
    `Apply this surface finish: ${surfacePrompt}.`,
    "Refinish the floor and repaint or replaster the walls. For the ceiling light fixture, follow the style description above exactly.",
    "If the input has a colored accent wall, dark wallpaper, or textured feature wall, preserve it as-is — apply the style's wall color only to the plain walls.",
    "Preserve the ceiling geometry exactly — vaults, beams, ribs, arches, and exposed structural elements must remain visible with their original rough texture, irregular edges, and surface patina intact. Apply the finish OVER the existing geometry. Do NOT smooth, flatten, or clean up beams or structural features.",
    "Preserve all wall-mounted fixed equipment visible in the input: radiators, heaters, vents, thermostats, electrical panels, and switches must remain in their exact position, size, and appearance.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no textiles, no decoration, no objects.",
    "The number of windows and doors must be EXACTLY the same as in the input. If there are zero windows, there must be zero windows in the output.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "Preserve the existing light direction, shadow angles, shadow intensity, and highlight/shadow distribution. Maintain the exact wall color temperature from the input — do not warm or cool the walls beyond what the style finish requires. Shadow patterns and light gradients must remain in the same positions and relative intensity. Keep the original light distribution — do not artificially brighten darker areas.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep depth of field, sharp focus throughout, subtle sensor grain (ISO 200), natural corner vignetting. No text, watermarks, or logos in the output.",
  ].join(" ");
}

function buildSurfacesFluxPrompt(surfacePrompt: string): string {
  return [
    `${surfacePrompt}, finished empty room interior.`,
    "Refinished floor, repainted walls. Ceiling light per style description.",
    "If a colored accent wall or dark wallpaper exists, preserve it — restyle plain walls only.",
    "Preserve ceiling geometry — vaults, beams, ribs, arches remain visible with original rough texture and edges. Apply finish over existing structure, do not smooth or flatten.",
    "Keep all wall-mounted equipment: radiators, heaters, vents, thermostats, switches in exact position.",
    "Completely empty room — no furniture, no rugs, no textiles, no objects.",
    "Exact same number of windows and doors as the original. Same room geometry, same proportions.",
    "Preserve existing light direction, shadow patterns, wall color temperature, light falloff, and camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────
function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  // F2: Kitchen and bathroom need built-in elements (cabinetry, vanity)
  let freestandingRule: string;
  if (roomTypeId === "kitchen") {
    freestandingRule = "Kitchen exception: built-in cabinetry, countertops, and integrated appliances are expected and should be placed realistically against walls. Other items (stools, pendant light, accessories) should be freestanding. No curtains.";
  } else if (roomTypeId === "bathroom") {
    freestandingRule = "Bathroom exception: wall-mounted vanity unit and mirror are expected. Other items (stool, basket, plant) should be freestanding. No curtains.";
  } else {
    freestandingRule = "ONLY add freestanding objects that rest on the floor or sit on existing surfaces. Do NOT attach anything to walls. No wall-mounted art, no built-in shelving, no curtains.";
  }

  return [
    `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
    "Distribute furniture across the FULL DEPTH and WIDTH of the room. If the room is deep or has multiple zones (e.g. under a mezzanine, an alcove, a back area), place a primary furniture group in the foreground AND a secondary group further back (reading nook, small desk, console table, side chair). If the room is also wide, add a lateral anchor (accent chair, floor lamp, or side table) on the opposite side to balance the composition. Do not leave the back or sides of the room empty.",
    "Place all objects naturally on the existing floor. Every piece of furniture — including those in the back of the room — must have correct perspective, scale, and cast realistic shadows consistent with the existing light direction and intensity. Match shadow hardness to the lighting type: soft diffused shadows for overcast or indirect light, hard-edged shadows for direct sunlight.",
    "If the ceiling appears very high (double height, >3m) or the room is very large, scale up furniture proportionally — use larger modular pieces, taller floor lamps, and more imposing accent furniture to match the volume.",
    "Respect the furniture density implied by the style description. If the style is minimalist, leave large areas of empty floor visible. If the room appears small, reduce accent pieces — skip secondary items rather than cramming everything in.",
    freestandingRule,
    "Room structure is LOCKED: every wall, window, door, ceiling, and floor surface must remain visually identical to the input — same colors, same textures, same geometry. Shadows cast by new furniture on walls and floor are expected and natural. No new openings.",
    "Preserve all wall-mounted fixed equipment visible in the input: radiators, heaters, vents, thermostats, and switches must remain visible. Do not place furniture in front of radiators.",
    "If the input has zero windows, the output must have zero windows.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic interior photograph. No text, watermarks, or logos in the output.",
  ].join(" ");
}

function buildFurnitureFluxPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  let freestandingRule: string;
  if (roomTypeId === "kitchen") {
    freestandingRule = "Kitchen: built-in cabinetry and countertops expected against walls. Stools and accessories freestanding. No curtains.";
  } else if (roomTypeId === "bathroom") {
    freestandingRule = "Bathroom: wall-mounted vanity and mirror expected. Other items freestanding. No curtains.";
  } else {
    freestandingRule = "Freestanding furniture only. No wall-mounted objects, no built-in shelving, no curtains.";
  }

  return [
    `${furniturePrompt}, placed naturally across the full depth of this finished room interior.`,
    "Distribute furniture in depth and width: primary group in foreground, secondary group in the back if space allows, lateral anchor (accent chair, floor lamp) on the opposite side if room is wide. Do not leave rear or side areas empty.",
    "Shadow hardness matches lighting: soft for diffused light, hard for direct sunlight. Scale furniture up if ceiling is very high.",
    freestandingRule,
    "Every wall, floor, and ceiling surface visually identical to input — same colors, same textures. Shadows from furniture are natural. No new openings.",
    "Keep all wall-mounted equipment: radiators, heaters, vents, switches visible. Do not place furniture in front of radiators.",
    "Same room geometry, same proportions, same camera angle, same lighting conditions.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

// Flux Depth Pro negative prompt — prevents common artifacts (indoor)
const FLUX_NEGATIVE_PROMPT =
  "distorted perspective, fisheye, stretched walls, shallow depth of field, bokeh, cartoon, illustration, 3D render, CGI, plastic, watermark, text, blurry, overexposed windows, extra windows, extra doors, floating furniture, dangling cables, junction box, unfinished floor, overly clean, flat lighting, color grading, warm color shift, cool color shift";

// Outdoor negative prompt — prevents indoor artifacts in outdoor generations
const OUTDOOR_NEGATIVE_PROMPT =
  "indoor sofa, area rug, floor lamp, ceiling light, chandelier, curtains, drapes, wallpaper, baseboard, interior door, radiator, electrical outlet, kitchen appliances, ceiling, roof, indoor plant pot on parquet, distorted perspective, fisheye, stretched walls, cartoon, illustration, 3D render, CGI, watermark, text, blurry";

// ── Outdoor Pass 1: Ground surface finishing (no ceiling, no luminaire) ──
function buildOutdoorSurfacesResponsesPrompt(
  surfacePrompt: string,
  subtypeOverride: string
): string {
  return [
    "Edit this outdoor photo. Keep exact same camera angle, lens distortion, vanishing points.",
    "Open-air space — no ceiling, sky preserved as-is. Preserve highlights — do not recover blown-out sky.",
    `Apply this ground surface finish: ${surfacePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Preserve all existing guard rails, exterior walls, facades, gates and fences. Do not add or remove any vertical structure.",
    "Preserve existing vegetation in the background. Only modify ground surface in the foreground zone.",
    "No furniture in this pass — EMPTY outdoor space with finished ground only.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting.",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOutdoorSurfacesFluxPrompt(
  surfacePrompt: string,
  subtypeOverride: string
): string {
  return [
    `${surfacePrompt}, finished empty outdoor space.`,
    "Open-air — no ceiling, sky preserved as-is. Preserve blown-out sky highlights.",
    subtypeOverride ? subtypeOverride : "",
    "Preserve all guard rails, exterior walls, facades, gates, fences. No new vertical structures.",
    "Preserve background vegetation. Only modify foreground ground surface.",
    "Empty outdoor space — no furniture, no rugs, no objects.",
    "Same camera angle, same proportions, same lighting conditions.",
    "Photo-realistic outdoor photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Outdoor Pass 2: Outdoor furniture placement ─────────────────────────
function buildOutdoorFurnitureResponsesPrompt(
  furniturePrompt: string,
  subtypeOverride: string
): string {
  return [
    `Add outdoor furniture and decoration to this photo of a finished outdoor space: ${furniturePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Distribute furniture naturally across the available floor space. If space is large, create a primary seating group and a secondary accent further back.",
    "Ground surfaces are LOCKED — same material, color, texture. Guard rails, walls, facades unchanged.",
    "Every piece must cast realistic shadows consistent with the existing natural light direction.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOutdoorFurnitureFluxPrompt(
  furniturePrompt: string,
  subtypeOverride: string
): string {
  return [
    `${furniturePrompt}, placed naturally across the available floor space of this finished outdoor area.`,
    subtypeOverride ? subtypeOverride : "",
    "Primary seating group in foreground, secondary accent further back if space allows.",
    "Ground surfaces LOCKED — same material, color, texture. Guard rails, walls, facades unchanged.",
    "Every piece casts realistic shadows consistent with existing natural light.",
    "Same camera angle, same proportions, same lighting conditions.",
    "Photo-realistic outdoor photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ─── OpenAI Responses API (PRIMARY) ─────────────────────────────────
async function tryOpenAIResponses(
  imageBase64: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  size: string,
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let prompt: string;
  if (outdoor?.isOutdoor) {
    prompt =
      pass === 1
        ? buildOutdoorSurfacesResponsesPrompt(surfacePrompt, outdoor.subtypeSurfaceOverride ?? "")
        : buildOutdoorFurnitureResponsesPrompt(furniturePrompt, outdoor.subtypeFurnitureOverride ?? "");
  } else {
    prompt =
      pass === 1
        ? buildSurfacesResponsesPrompt(surfacePrompt)
        : buildFurnitureResponsesPrompt(furniturePrompt, roomTypeId);
  }

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high",
          },
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
    tools: [
      {
        type: "image_generation",
        input_fidelity: "high",
        size: size as "1024x1024" | "1536x1024" | "1024x1536",
      },
    ],
  });

  const imageOutput = response.output.find(
    (o: { type: string }) => o.type === "image_generation_call"
  );

  if (!imageOutput || !("result" in imageOutput)) {
    throw new Error("No image generated by OpenAI Responses API");
  }

  const resultB64 = (imageOutput as { result: string }).result;
  if (!resultB64) {
    throw new Error("Empty image result from OpenAI Responses API");
  }

  return {
    image: `data:image/png;base64,${resultB64}`,
    model: `OpenAI GPT-4.1 (pass ${pass})`,
  };
}

// ─── Replicate Fallback (Flux Depth Pro) ─────────────────────────────
async function tryFluxDepth(
  imageBase64: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  width: number,
  height: number,
  additionalNegative: string = "",
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;
  let prompt: string;
  let negativeBase: string;
  if (outdoor?.isOutdoor) {
    prompt =
      pass === 1
        ? buildOutdoorSurfacesFluxPrompt(surfacePrompt, outdoor.subtypeSurfaceOverride ?? "")
        : buildOutdoorFurnitureFluxPrompt(furniturePrompt, outdoor.subtypeFurnitureOverride ?? "");
    negativeBase = OUTDOOR_NEGATIVE_PROMPT;
  } else {
    prompt =
      pass === 1
        ? buildSurfacesFluxPrompt(surfacePrompt)
        : buildFurnitureFluxPrompt(furniturePrompt, roomTypeId);
    negativeBase = FLUX_NEGATIVE_PROMPT;
  }

  // Pass 1 (surfaces): lower guidance to stay closer to input geometry
  // Pass 2 (furniture): slightly higher guidance to ensure furniture appears
  const guidance = pass === 1 ? 12 : 15;

  const output = await replicate.run(
    "black-forest-labs/flux-depth-pro" as `${string}/${string}`,
    {
      input: {
        prompt,
        negative_prompt: additionalNegative
          ? `${negativeBase}, ${additionalNegative}`
          : negativeBase,
        control_image: dataUri,
        width,
        height,
        steps: 25,
        guidance,
        output_format: "png",
      },
    }
  );

  let imageUrl: string;
  if (typeof output === "string") {
    imageUrl = output;
  } else if (output && typeof output === "object" && "url" in output) {
    imageUrl = (output as { url: () => string }).url();
  } else if (Array.isArray(output) && output.length > 0) {
    imageUrl = typeof output[0] === "string" ? output[0] : String(output[0]);
  } else {
    throw new Error("Unexpected output format from Flux Depth Pro");
  }

  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    model: `Flux Depth Pro (pass ${pass})`,
  };
}

// ─── Iteration-specific generation (pre-built prompt) ────────────────
async function tryOpenAIResponsesWithPrompt(
  imageBase64: string,
  prompt: string,
  size: string
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high",
          },
          { type: "input_text", text: prompt },
        ],
      },
    ],
    tools: [
      {
        type: "image_generation",
        input_fidelity: "high",
        size: size as "1024x1024" | "1536x1024" | "1024x1536",
      },
    ],
  });

  const imageOutput = response.output.find(
    (o: { type: string }) => o.type === "image_generation_call"
  );

  if (!imageOutput || !("result" in imageOutput)) {
    throw new Error("No image generated by OpenAI Responses API (iteration)");
  }

  const resultB64 = (imageOutput as { result: string }).result;
  if (!resultB64) {
    throw new Error("Empty image result from OpenAI Responses API (iteration)");
  }

  return {
    image: `data:image/png;base64,${resultB64}`,
    model: "OpenAI GPT-4.1 (iteration)",
  };
}

async function tryFluxDepthWithPrompt(
  imageBase64: string,
  prompt: string,
  width: number,
  height: number
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;

  const output = await replicate.run(
    "black-forest-labs/flux-depth-pro" as `${string}/${string}`,
    {
      input: {
        prompt,
        negative_prompt: FLUX_ITERATION_NEGATIVE_PROMPT,
        control_image: dataUri,
        width,
        height,
        steps: 25,
        guidance: 15,
        output_format: "png",
      },
    }
  );

  let imageUrl: string;
  if (typeof output === "string") {
    imageUrl = output;
  } else if (output && typeof output === "object" && "url" in output) {
    imageUrl = (output as { url: () => string }).url();
  } else if (Array.isArray(output) && output.length > 0) {
    imageUrl = typeof output[0] === "string" ? output[0] : String(output[0]);
  } else {
    throw new Error("Unexpected output format from Flux Depth Pro (iteration)");
  }

  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    model: "Flux Depth Pro (iteration)",
  };
}

async function generateIterationPass(
  base64Image: string,
  responsesPrompt: string,
  fluxPrompt: string,
  outputSize: { openai: string; w: number; h: number }
): Promise<{ image: string; model: string }> {
  let openaiError: Error | null = null;
  let replicateError: Error | null = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await tryOpenAIResponsesWithPrompt(base64Image, responsesPrompt, outputSize.openai);
    } catch (err) {
      openaiError = err instanceof Error ? err : new Error(String(err));
      console.error("OpenAI iteration failed:", openaiError.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await tryFluxDepthWithPrompt(base64Image, fluxPrompt, outputSize.w, outputSize.h);
    } catch (err) {
      replicateError = err instanceof Error ? err : new Error(String(err));
      console.error("Flux Depth iteration failed:", replicateError.message);
    }
  }

  if (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN) {
    throw new Error("Aucune clé API configurée.");
  }

  const details: string[] = [];
  if (openaiError) details.push(`OpenAI : ${openaiError.message}`);
  if (replicateError) details.push(`Replicate : ${replicateError.message}`);
  throw new Error(`Échec itération. ${details.join(" | ")}`);
}

// ─── Generate one pass with fallback ─────────────────────────────────
async function generatePass(
  base64Image: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  outputSize: { openai: string; w: number; h: number },
  additionalNegative: string = "",
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  let openaiError: Error | null = null;
  let replicateError: Error | null = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await tryOpenAIResponses(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.openai, roomTypeId, outdoor);
    } catch (err) {
      openaiError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenAI pass ${pass} failed:`, openaiError.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await tryFluxDepth(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.w, outputSize.h, additionalNegative, roomTypeId, outdoor);
    } catch (err) {
      replicateError = err instanceof Error ? err : new Error(String(err));
      console.error(`Flux Depth pass ${pass} failed:`, replicateError.message);
    }
  }

  if (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN) {
    throw new Error("Aucune clé API configurée.");
  }

  const details: string[] = [];
  if (openaiError) details.push(`OpenAI : ${openaiError.message}`);
  if (replicateError) details.push(`Replicate : ${replicateError.message}`);
  throw new Error(`Échec passe ${pass}. ${details.join(" | ")}`);
}

// ─── API Route Handler ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter une minute avant de réessayer." },
      { status: 429 }
    );
  }

  let styleId = "unknown";

  try {
    const body = await request.json();
    const {
      image,
      surfacePrompt,
      furniturePrompt,
      styleId: bodyStyleId = "custom",
      withFurniture = true,
      width,
      height,
      // F1 iteration params
      pass1_key: pass1Key,
      iterationComment,
      previousModifications = [],
      sessionId,
      // F2 room type
      roomType = null,
      // F3 outdoor
      isOutdoor = false,
      outdoorSubtype = null,
    } = body as {
      image?: string;
      surfacePrompt?: string;
      furniturePrompt?: string;
      styleId?: string;
      withFurniture?: boolean;
      width?: number;
      height?: number;
      pass1_key?: string;
      iterationComment?: string;
      previousModifications?: string[];
      sessionId?: string;
      roomType?: string | null;
      isOutdoor?: boolean;
      outdoorSubtype?: string | null;
    };

    styleId = bodyStyleId;

    // ── F1 Iteration flow: re-pass 2 only ────────────────────────────
    if (pass1Key) {
      if (!iterationComment || !iterationComment.trim()) {
        return NextResponse.json(
          { error: "Le commentaire d'itération est requis." },
          { status: 400 }
        );
      }

      // Load pass 1 from Object Storage cache
      const cached = await getPass1Cache(pass1Key);
      if (!cached) {
        return NextResponse.json(
          { error: "Passe 1 introuvable. Veuillez regénérer depuis l'image originale." },
          { status: 404 }
        );
      }

      // Check TTL (24h)
      const age = Date.now() - cached.meta.createdAt;
      if (age > PASS1_TTL_MS) {
        return NextResponse.json(
          { error: "Les surfaces de cette génération ont expiré (>24h). Regénérez depuis l'image originale." },
          { status: 410 }
        );
      }

      // Check max iterations
      if (previousModifications.length >= MAX_ITERATIONS) {
        return NextResponse.json(
          { error: `Nombre maximum d'itérations atteint (${MAX_ITERATIONS}).` },
          { status: 403 }
        );
      }

      const outputSize = getOutputSize(cached.meta.width, cached.meta.height);
      const originalFurniturePrompt = cached.meta.furniturePrompt;

      // Pre-process the iteration comment via GPT-4.1-mini
      console.log("Pre-processing iteration comment...");
      const preprocessResult = await preprocessIterationComment(
        iterationComment.trim(),
        cached.meta.styleId,
        originalFurniturePrompt
      );

      // Build all modifications: previous + current enriched
      const allModifications = [...previousModifications, preprocessResult.enrichedComment];

      // Build iteration prompts — use outdoor builders if the original generation was outdoor
      const iterMeta = {
        width: cached.meta.width,
        height: cached.meta.height,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor,
      };

      let responsesPrompt: string;
      let fluxPrompt: string;

      if (cached.meta.isOutdoor) {
        responsesPrompt = buildIterationOutdoorFurnitureResponsesPrompt(
          originalFurniturePrompt,
          allModifications
        );
        fluxPrompt = buildIterationOutdoorFurnitureFluxPrompt(
          originalFurniturePrompt,
          allModifications
        );
      } else {
        responsesPrompt = buildIterationFurnitureResponsesPrompt(
          originalFurniturePrompt,
          allModifications,
          iterMeta
        );
        fluxPrompt = buildIterationFurnitureFluxPrompt(
          originalFurniturePrompt,
          allModifications,
          iterMeta
        );
      }

      const t0 = Date.now();
      console.log(`Starting iteration pass 2... Output size: ${outputSize.openai}`);
      const result = await generateIterationPass(cached.imageBase64, responsesPrompt, fluxPrompt, outputSize);
      const t1 = Date.now();

      const outputBase64 = result.image.replace(/^data:image\/[\w+]+;base64,/, "");
      const iterationNumber = previousModifications.length + 1;

      // Save iteration result to Object Storage
      const response = NextResponse.json({
        image: result.image,
        model: result.model,
        iterationNumber,
        warnings: preprocessResult.warnings,
        enrichedComment: preprocessResult.enrichedComment,
      });

      // Fire-and-forget: log + save iteration image
      logGeneration({
        ip,
        styleId: cached.meta.styleId,
        surfacePrompt: cached.meta.surfacePrompt,
        furniturePrompt: originalFurniturePrompt,
        withFurniture: true,
        inputWidth: cached.meta.width,
        inputHeight: cached.meta.height,
        modelUsed: result.model,
        pass2Model: result.model,
        durationMs: t1 - t0,
        pass2DurationMs: t1 - t0,
        success: true,
        builtPromptPass2: responsesPrompt,
        outputBase64,
        // Iteration-specific fields
        isIteration: true,
        iterationNumber,
        sessionId: sessionId ?? undefined,
        userCommentRaw: iterationComment.trim(),
        userCommentEnriched: preprocessResult.enrichedComment,
        pass1CacheKey: pass1Key,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor || undefined,
        outdoorSubtype: cached.meta.outdoorSubtype ?? undefined,
      }).catch((err) => console.error("DB log (iteration) failed:", err));

      return response;
    }

    // ── Standard generation flow (pass 1 + pass 2) ────────────────────
    if (!image || !surfacePrompt || !furniturePrompt) {
      return NextResponse.json(
        { error: "Image et style requis" },
        { status: 400 }
      );
    }

    // Calculate output size matching the input aspect ratio
    const outputSize = getOutputSize(width, height);

    const base64Image = image.replace(/^data:image\/[\w+]+;base64,/, "");

    const estimatedSize = (base64Image.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image dépasse la taille maximale de 10 Mo" },
        { status: 413 }
      );
    }

    // ── Pipeline 2 passes ────────────────────────────────────────────
    // Pass 1: Finish surfaces using surfacePrompt — room stays empty
    // Pass 2 (optional): Add furniture using furniturePrompt — surfaces untouched

    // F3: Apply outdoor subtype overrides OR F2 room type overrides (mutually exclusive)
    let trimmedSurface: string;
    let trimmedFurniture: string;
    let negativeOverride: string;
    let outdoorParam: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string } | undefined;

    if (isOutdoor) {
      // Outdoor mode: apply subtype overrides, no room type
      const { effectiveSurfacePrompt, effectiveFurniturePrompt, subtypeNegativeOverride } =
        applyOutdoorSubtypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), outdoorSubtype ?? null);
      trimmedSurface = effectiveSurfacePrompt;
      trimmedFurniture = effectiveFurniturePrompt;
      negativeOverride = subtypeNegativeOverride;

      // Extract raw subtype overrides for injection into builders
      const sub = outdoorSubtype ? OUTDOOR_SUBTYPES[outdoorSubtype] : null;
      outdoorParam = {
        isOutdoor: true,
        subtypeSurfaceOverride: sub?.subtypeSurfaceOverride ?? "",
        subtypeFurnitureOverride: sub?.subtypeFurnitureOverride ?? "",
      };
    } else {
      // Indoor mode: apply room type overrides
      const { effectiveSurfacePrompt, effectiveFurniturePrompt, roomNegativeOverride } =
        applyRoomTypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), roomType ?? null);
      trimmedSurface = effectiveSurfacePrompt;
      trimmedFurniture = effectiveFurniturePrompt;
      negativeOverride = roomNegativeOverride;
    }

    const t0 = Date.now();

    console.log(`Starting pass 1 (surfaces)... Output size: ${outputSize.openai}${isOutdoor ? ` outdoor subtype: ${outdoorSubtype}` : roomType ? ` roomType: ${roomType}` : ""}`);
    const pass1 = await generatePass(base64Image, trimmedSurface, trimmedFurniture, 1, outputSize, negativeOverride, isOutdoor ? null : roomType, outdoorParam);
    const t1 = Date.now();

    // Build the final prompts for logging (what the model actually receives)
    const builtPromptPass1 = isOutdoor
      ? buildOutdoorSurfacesResponsesPrompt(trimmedSurface, outdoorParam?.subtypeSurfaceOverride ?? "")
      : buildSurfacesResponsesPrompt(trimmedSurface);
    const builtPromptPass2 = isOutdoor
      ? buildOutdoorFurnitureResponsesPrompt(trimmedFurniture, outdoorParam?.subtypeFurnitureOverride ?? "")
      : buildFurnitureResponsesPrompt(trimmedFurniture, roomType);

    const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

    // Cache pass 1 for F1 iterations (fire-and-forget)
    const pass1CacheKey = sessionId
      ? `sessions/${sessionId}/pass1_${Date.now()}.jpg`
      : `sessions/anon_${Date.now()}/pass1.jpg`;

    savePass1Cache(pass1CacheKey, pass1Base64, {
      width: width ?? outputSize.w,
      height: height ?? outputSize.h,
      styleId,
      furniturePrompt: trimmedFurniture,
      surfacePrompt: trimmedSurface,
      createdAt: Date.now(),
      roomType: isOutdoor ? null : (roomType ?? null),
      isOutdoor: isOutdoor || undefined,
      outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
    }).catch((err) => console.error("Pass1 cache save failed:", err));

    // If surfaces-only mode, return pass 1 result directly
    if (!withFurniture) {
      const outputBase64 = pass1Base64;
      const response = NextResponse.json({
        image: pass1.image,
        model: `${pass1.model} (surfaces uniquement)`,
        pass1_key: pass1CacheKey,
      });

      // Fire-and-forget: log to DB + save images to filesystem
      logGeneration({
        ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
        withFurniture: false, inputWidth: width, inputHeight: height,
        modelUsed: `${pass1.model} (surfaces uniquement)`,
        pass1Model: pass1.model, durationMs: t1 - t0, pass1DurationMs: t1 - t0,
        success: true,
        builtPromptPass1,
        inputBase64: base64Image, outputBase64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey,
        roomType: isOutdoor ? undefined : (roomType ?? undefined),
        isOutdoor: isOutdoor || undefined,
        outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
      }).catch((err) => console.error("DB log failed:", err));

      return response;
    }

    console.log("Starting pass 2 (furniture)...");
    const pass2 = await generatePass(pass1Base64, trimmedSurface, trimmedFurniture, 2, outputSize, negativeOverride, isOutdoor ? null : roomType, outdoorParam);
    const t2 = Date.now();

    const outputBase64 = pass2.image.replace(/^data:image\/[\w+]+;base64,/, "");
    const response = NextResponse.json({
      image: pass2.image,
      model: `${pass1.model} → ${pass2.model}`,
      pass1_key: pass1CacheKey,
    });

    // Fire-and-forget: log to DB + save images to filesystem
    logGeneration({
      ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
      withFurniture: true, inputWidth: width, inputHeight: height,
      modelUsed: `${pass1.model} → ${pass2.model}`,
      pass1Model: pass1.model, pass2Model: pass2.model,
      durationMs: t2 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: t2 - t1,
      success: true,
      builtPromptPass1, builtPromptPass2,
      inputBase64: base64Image, pass1Base64, outputBase64,
      sessionId: sessionId ?? undefined,
      pass1CacheKey,
      roomType: isOutdoor ? undefined : (roomType ?? undefined),
      isOutdoor: isOutdoor || undefined,
      outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
    }).catch((err) => console.error("DB log failed:", err));

    return response;
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne du serveur";

    // Log failures too
    logGeneration({
      ip, styleId,
      surfacePrompt: "error", furniturePrompt: "error",
      withFurniture: true, success: false, errorMessage: message,
    }).catch((err) => console.error("DB log failed:", err));

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
