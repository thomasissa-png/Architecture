import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";
import { logGeneration } from "@/lib/db";

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
    "Preserve the ceiling geometry exactly — vaults, beams, ribs, arches, and structural elements must remain visible and unchanged. Apply the finish (paint or plaster) OVER the existing geometry, do not smooth or flatten any structural features.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no textiles, no decoration, no objects.",
    "The number of windows and doors must be EXACTLY the same as in the input. If there are zero windows, there must be zero windows in the output.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "Preserve the existing light direction, shadow angles, shadow intensity, color temperature, and highlight/shadow distribution. The overall room may appear slightly brighter due to lighter surfaces — this is acceptable — but shadow patterns and light gradients must remain in the same positions and relative intensity. Keep the original light distribution — do not artificially brighten darker areas.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep depth of field, sharp focus throughout, subtle sensor grain (ISO 200), natural corner vignetting. No text, watermarks, or logos in the output.",
  ].join(" ");
}

function buildSurfacesFluxPrompt(surfacePrompt: string): string {
  return [
    `${surfacePrompt}, finished empty room interior.`,
    "Refinished floor, repainted walls. Ceiling light per style description.",
    "Preserve ceiling geometry — vaults, beams, ribs, arches remain visible. Apply finish over existing structure.",
    "Completely empty room — no furniture, no rugs, no textiles, no objects.",
    "Exact same number of windows and doors as the original. Same room geometry, same proportions.",
    "Preserve existing light direction, shadow patterns, light falloff, and camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────
function buildFurnitureResponsesPrompt(furniturePrompt: string): string {
  return [
    `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
    "Distribute furniture across the FULL DEPTH and WIDTH of the room. If the room is deep or has multiple zones (e.g. under a mezzanine, an alcove, a back area), place a primary furniture group in the foreground AND a secondary group further back (reading nook, small desk, console table, side chair). If the room is also wide, add a lateral anchor (accent chair, floor lamp, or side table) on the opposite side to balance the composition. Do not leave the back or sides of the room empty.",
    "Place all objects naturally on the existing floor. Every piece of furniture — including those in the back of the room — must have correct perspective, scale, and cast realistic shadows consistent with the existing light direction and intensity. Match shadow hardness to the lighting type: soft diffused shadows for overcast or indirect light, hard-edged shadows for direct sunlight.",
    "If the ceiling appears very high (double height, >3m) or the room is very large, scale up furniture proportionally — use larger modular pieces, taller floor lamps, and more imposing accent furniture to match the volume.",
    "Respect the furniture density implied by the style description. If the style is minimalist, leave large areas of empty floor visible. If the room appears small, reduce accent pieces — skip secondary items rather than cramming everything in.",
    "ONLY add freestanding objects that rest on the floor or sit on existing surfaces. Do NOT attach anything to walls. No wall-mounted art, no built-in shelving, no curtains.",
    "Room structure is LOCKED: every wall, window, door, ceiling, and floor surface must remain visually identical to the input — same colors, same textures, same geometry. Shadows cast by new furniture on walls and floor are expected and natural. No new openings.",
    "If the input has zero windows, the output must have zero windows.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic interior photograph. No text, watermarks, or logos in the output.",
  ].join(" ");
}

function buildFurnitureFluxPrompt(furniturePrompt: string): string {
  return [
    `${furniturePrompt}, placed naturally across the full depth of this finished room interior.`,
    "Distribute furniture in depth and width: primary group in foreground, secondary group in the back if space allows, lateral anchor (accent chair, floor lamp) on the opposite side if room is wide. Do not leave rear or side areas empty.",
    "Shadow hardness matches lighting: soft for diffused light, hard for direct sunlight. Scale furniture up if ceiling is very high.",
    "Freestanding furniture only. No wall-mounted objects, no built-in shelving, no curtains.",
    "Every wall, floor, and ceiling surface visually identical to input — same colors, same textures. Shadows from furniture are natural. No new openings.",
    "Same room geometry, same proportions, same camera angle, same lighting conditions.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

// Flux Depth Pro negative prompt — prevents common artifacts
const FLUX_NEGATIVE_PROMPT =
  "distorted perspective, fisheye, stretched walls, shallow depth of field, bokeh, cartoon, illustration, 3D render, CGI, plastic, watermark, text, blurry, overexposed windows, extra windows, extra doors, floating furniture, dangling cables, junction box, unfinished floor, overly clean, flat lighting, color grading, warm color shift, cool color shift";

// ─── OpenAI Responses API (PRIMARY) ─────────────────────────────────
async function tryOpenAIResponses(
  imageBase64: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  size: string
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt =
    pass === 1
      ? buildSurfacesResponsesPrompt(surfacePrompt)
      : buildFurnitureResponsesPrompt(furniturePrompt);

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
  height: number
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;
  const prompt =
    pass === 1
      ? buildSurfacesFluxPrompt(surfacePrompt)
      : buildFurnitureFluxPrompt(furniturePrompt);

  // Pass 1 (surfaces): lower guidance to stay closer to input geometry
  // Pass 2 (furniture): slightly higher guidance to ensure furniture appears
  const guidance = pass === 1 ? 12 : 15;

  const output = await replicate.run(
    "black-forest-labs/flux-depth-pro" as `${string}/${string}`,
    {
      input: {
        prompt,
        negative_prompt: FLUX_NEGATIVE_PROMPT,
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

// ─── Generate one pass with fallback ─────────────────────────────────
async function generatePass(
  base64Image: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  outputSize: { openai: string; w: number; h: number }
): Promise<{ image: string; model: string }> {
  let openaiError: Error | null = null;
  let replicateError: Error | null = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await tryOpenAIResponses(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.openai);
    } catch (err) {
      openaiError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenAI pass ${pass} failed:`, openaiError.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await tryFluxDepth(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.w, outputSize.h);
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
    const { image, surfacePrompt, furniturePrompt, styleId: bodyStyleId = "custom", withFurniture = true, width, height } = body as {
      image: string;
      surfacePrompt: string;
      furniturePrompt: string;
      styleId?: string;
      withFurniture?: boolean;
      width?: number;
      height?: number;
    };

    styleId = bodyStyleId;

    // Calculate output size matching the input aspect ratio
    const outputSize = getOutputSize(width, height);

    if (!image || !surfacePrompt || !furniturePrompt) {
      return NextResponse.json(
        { error: "Image et style requis" },
        { status: 400 }
      );
    }

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
    const trimmedSurface = surfacePrompt.trim();
    const trimmedFurniture = furniturePrompt.trim();

    const t0 = Date.now();

    console.log(`Starting pass 1 (surfaces)... Output size: ${outputSize.openai}`);
    const pass1 = await generatePass(base64Image, trimmedSurface, trimmedFurniture, 1, outputSize);
    const t1 = Date.now();

    // Build the final prompts for logging (what the model actually receives)
    const builtPromptPass1 = buildSurfacesResponsesPrompt(trimmedSurface);
    const builtPromptPass2 = buildFurnitureResponsesPrompt(trimmedFurniture);

    // If surfaces-only mode, return pass 1 result directly
    if (!withFurniture) {
      const outputBase64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");
      const response = NextResponse.json({
        image: pass1.image,
        model: `${pass1.model} (surfaces uniquement)`,
      });

      // Fire-and-forget: log to DB + save images to filesystem
      logGeneration({
        ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
        withFurniture: false, inputWidth: width, inputHeight: height,
        modelUsed: `${pass1.model} (surfaces uniquement)`,
        pass1Model: pass1.model, durationMs: t1 - t0, pass1DurationMs: t1 - t0,
        success: true,
        builtPromptPass1,
        inputBase64: base64Image, outputBase64: outputBase64,
      }).catch((err) => console.error("DB log failed:", err));

      return response;
    }

    const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

    console.log("Starting pass 2 (furniture)...");
    const pass2 = await generatePass(pass1Base64, trimmedSurface, trimmedFurniture, 2, outputSize);
    const t2 = Date.now();

    const outputBase64 = pass2.image.replace(/^data:image\/[\w+]+;base64,/, "");
    const response = NextResponse.json({
      image: pass2.image,
      model: `${pass1.model} → ${pass2.model}`,
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
      inputBase64: base64Image, pass1Base64, outputBase64: outputBase64,
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
