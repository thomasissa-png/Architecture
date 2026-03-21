import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";

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
// PIPELINE 2 PASSES:
// Pass 1 (surfaces): Finish raw surfaces (walls, floor, ceiling) — NO furniture.
// Pass 2 (furniture): Add furniture and decoration to the finished room — NO surface changes.

// ── Pass 1: Surface finishing ────────────────────────────────────────
function buildSurfacesResponsesPrompt(stylePrompt: string): string {
  const cleanStyle = sanitizeStyleForFurniturePass(stylePrompt);
  return [
    "Edit this photo of a room.",
    `Apply a ${cleanStyle} finish to the surfaces only: refinish the floor, repaint or replaster walls and ceiling to match the style.`,
    "Refinish existing baseboards and trim to match the style. Replace the existing ceiling light fixture with one consistent with the style.",
    "Match the wall color precisely to the input — do not shift the hue, do not warm up or cool down the tone.",
    "The number of windows and doors must be EXACTLY the same as in the input photo. If there are zero windows, there must be zero windows in the output.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no curtains, no textiles, no decoration, no objects on the floor or walls.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, and room proportions.",
    "Preserve the existing lighting conditions, light direction, shadow angles, color temperature, and exposure exactly as in the input photo.",
    "DSLR full-frame, wide-angle 16-35mm, f/8, deep depth of field, sharp focus throughout.",
  ].join(" ");
}

function buildSurfacesFluxPrompt(stylePrompt: string): string {
  const cleanStyle = sanitizeStyleForFurniturePass(stylePrompt);
  return [
    `${cleanStyle} finished empty room interior.`,
    "Refinished floor, repainted walls, smooth ceiling with updated light fixture.",
    "Exact same number of windows and doors as the original photo. Wall color hue unchanged.",
    "Completely empty room — no furniture, no rugs, no curtains, no textiles, no decoration, no objects.",
    "Same room geometry, same proportions, same lighting conditions, same camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus.",
  ].join(" ");
}

// ── Style prompt sanitizer for pass 2 ────────────────────────────────
// Remove curtain/drape/window references from the style prompt to prevent
// the model from hallucinating windows to hang curtains on.
function sanitizeStyleForFurniturePass(stylePrompt: string): string {
  // Remove clauses that mention curtains, drapes, or windows to prevent
  // the model from hallucinating windows to hang curtains on.
  return stylePrompt
    // Remove full comma-separated clauses containing curtains/drapes
    // Matches: ", sheer linen curtains filtering soft diffused Nordic daylight"
    // Matches: ", heavy velvet drapes in deep jewel tones"
    // Matches: ", heavy linen or velvet drapes in muted tones"
    // Matches: ", floor-to-ceiling sheer curtains"
    .replace(/,\s*[^,]*(?:curtains?|drapes?)[^,]*/gi, "")
    // Remove "no curtains with bare/raw windows" patterns (also comma-delimited)
    .replace(/,\s*no curtains\s+with\s+[^,]*/gi, "")
    // Remove "from tall French windows" in light descriptions
    .replace(/from\s+(tall\s+)?French\s+windows/gi, "")
    // Clean up punctuation artifacts
    .replace(/,\s*,/g, ",")       // double commas
    .replace(/,\s*$/g, "")         // trailing comma
    .replace(/^\s*,/g, "")         // leading comma
    .replace(/\s+,/g, ",")         // space before comma
    .replace(/\s{2,}/g, " ")       // multiple spaces
    .trim();
}

// ── Pass 2: Furniture placement ──────────────────────────────────────
function buildFurnitureResponsesPrompt(stylePrompt: string): string {
  const cleanStyle = sanitizeStyleForFurniturePass(stylePrompt);
  return [
    `Add ${cleanStyle} furniture and freestanding decoration into this photo of a finished room.`,
    "Add seating, a coffee table, a floor rug, floor lamps, plants, and decorative objects appropriate for the style.",
    "ONLY add freestanding objects that rest on the floor or sit on existing surfaces. Do NOT attach anything to walls, do NOT add wall art, do NOT add built-in shelving.",
    "The room structure is LOCKED: every wall, window, door, ceiling, and floor surface must appear pixel-identical to the input. No new openings, no removed openings, no color shift on any surface.",
    "If the input has no windows, the output must have no windows. If the input has one window, the output must have exactly one window in the same position.",
    "Furniture must sit on the existing floor with correct perspective, scale, and shadows consistent with the existing light direction.",
    "Photo-realistic interior photograph, same camera angle, same lens distortion, same vanishing points, DSLR full-frame 16-35mm f/8, deep DOF.",
  ].join(" ");
}

function buildFurnitureFluxPrompt(stylePrompt: string): string {
  const cleanStyle = sanitizeStyleForFurniturePass(stylePrompt);
  return [
    `${cleanStyle} furnished room interior.`,
    "Sofa, coffee table, floor rug, floor lamp, plants, and decorative objects placed naturally on the existing floor.",
    "Freestanding furniture only. No wall-mounted objects, no built-in shelving.",
    "Every wall, floor, and ceiling surface identical to input — same colors, same textures, no new openings in walls.",
    "Exact same number of windows and doors as original. Same room geometry, same proportions, same lighting, same camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus.",
  ].join(" ");
}

// ─── OpenAI Responses API (PRIMARY) ─────────────────────────────────
async function tryOpenAIResponses(
  imageBase64: string,
  stylePrompt: string,
  pass: 1 | 2,
  size: string
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt =
    pass === 1
      ? buildSurfacesResponsesPrompt(stylePrompt)
      : buildFurnitureResponsesPrompt(stylePrompt);

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
  stylePrompt: string,
  pass: 1 | 2,
  width: number,
  height: number
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;
  const prompt =
    pass === 1
      ? buildSurfacesFluxPrompt(stylePrompt)
      : buildFurnitureFluxPrompt(stylePrompt);

  // Pass 1 (surfaces): lower guidance to stay closer to input geometry
  // Pass 2 (furniture): slightly higher guidance to ensure furniture appears
  const guidance = pass === 1 ? 12 : 15;

  const output = await replicate.run(
    "black-forest-labs/flux-depth-pro" as `${string}/${string}`,
    {
      input: {
        prompt,
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
  stylePrompt: string,
  pass: 1 | 2,
  outputSize: { openai: string; w: number; h: number }
): Promise<{ image: string; model: string }> {
  let openaiError: Error | null = null;
  let replicateError: Error | null = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await tryOpenAIResponses(base64Image, stylePrompt, pass, outputSize.openai);
    } catch (err) {
      openaiError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenAI pass ${pass} failed:`, openaiError.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await tryFluxDepth(base64Image, stylePrompt, pass, outputSize.w, outputSize.h);
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

  try {
    const body = await request.json();
    const { image, stylePrompt, width, height } = body as {
      image: string;
      stylePrompt: string;
      width?: number;
      height?: number;
    };

    // Calculate output size matching the input aspect ratio
    const outputSize = getOutputSize(width, height);

    if (!image || !stylePrompt || !stylePrompt.trim()) {
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
    // Pass 1: Finish surfaces (walls, floor, ceiling) — room stays empty
    // Pass 2: Add furniture on the finished room — surfaces untouched
    const trimmedStyle = stylePrompt.trim();

    console.log(`Starting pass 1 (surfaces)... Output size: ${outputSize.openai}`);
    const pass1 = await generatePass(base64Image, trimmedStyle, 1, outputSize);
    const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

    console.log("Starting pass 2 (furniture)...");
    const pass2 = await generatePass(pass1Base64, trimmedStyle, 2, outputSize);

    return NextResponse.json({
      image: pass2.image,
      model: `${pass1.model} → ${pass2.model}`,
    });
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
