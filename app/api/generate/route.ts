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

// ─── Prompt Engineering ──────────────────────────────────────────────
//
// STEP 1 ONLY — finish the room surfaces (walls, floor, ceiling, lighting).
// No furniture. The goal is to take a raw/construction photo and produce
// a clean, finished empty room that preserves the EXACT same geometry,
// camera angle, perspective, and architectural proportions.
//
// Step 2 (furniture) will come later once step 1 is validated.
//
// Key principle: the less we ask the model to change, the better it
// preserves the original image's geometry and camera angle.

function buildGPTPrompt(stylePrompt: string): string {
  return [
    "Edit this photo. This is a SURFACE-ONLY edit — do NOT change the room layout.",
    "CRITICAL: Keep the EXACT same camera angle, the EXACT same perspective, the EXACT same room shape, the EXACT same wall positions, the EXACT same window positions and sizes, the EXACT same door positions. Do NOT crop, zoom, or reframe.",
    "ONLY change surface finishes: REPLACE raw concrete floor with polished finished floor. REPLACE raw plaster with smooth painted walls. REPLACE unfinished ceiling with clean painted ceiling.",
    "REMOVE exposed wires, dangling cables, junction boxes. ADD one ceiling light fixture. ADD baseboards. ADD finished outlet covers.",
    "Keep the room EMPTY — absolutely no furniture, no table, no chair, no rug, no decoration, no objects.",
    `Color palette: ${stylePrompt}.`,
    "Preserve existing lighting direction and color temperature.",
  ].join(" ");
}

function buildDalle2Prompt(stylePrompt: string): string {
  const prompt = [
    `Interior photo of a finished empty room with ${stylePrompt} color palette.`,
    "Same exact room, same angle, same perspective as original photo.",
    "Smooth painted walls with baseboards, polished floor, clean ceiling with one light fixture, finished outlet covers.",
    "No exposed wires, no raw concrete, no construction debris. Preserve beams and ceiling structure.",
    "Completely empty — no furniture, no objects, no decoration.",
    "DSLR 16-35mm f/8, deep depth of field, sharp focus.",
  ].join(" ");
  return prompt.slice(0, 1000);
}

function buildSDXLPrompt(stylePrompt: string): string {
  return [
    `${stylePrompt} color palette, beautifully finished empty room.`,
    "Smooth painted walls with baseboards, polished floor, clean ceiling, elegant ceiling light fixture, finished outlet covers.",
    "No exposed wires, no raw concrete, no construction debris, preserve beams.",
    "No furniture, no rugs, no decoration.",
    "Same room same angle same perspective same lighting.",
    "DSLR 16-35mm f/8 interior photograph, deep depth of field, sharp focus.",
  ].join(" ");
}

const SDXL_NEGATIVE_PROMPT = [
  "furniture", "sofa", "chair", "table", "bed", "rug", "curtains", "cushion",
  "construction site", "exposed wires", "dangling cables", "junction box", "raw concrete", "raw plaster", "unfinished floor",
  "blurry", "cartoon", "painting", "3D render", "watermark", "text",
  "animal", "person", "different room", "different angle",
  "distorted perspective", "fisheye", "different viewpoint", "new room", "stretched walls",
  "shallow depth of field", "bokeh",
].join(", ");

// ─── Aspect Ratio Detection ────────────────────────────────────────
function getOpenAISize(width?: number, height?: number): "1024x1024" | "1536x1024" | "1024x1536" {
  if (!width || !height) return "1024x1024";
  const ratio = width / height;
  if (ratio > 1.3) return "1536x1024";
  if (ratio < 0.77) return "1024x1536";
  return "1024x1024";
}

// ─── OpenAI Provider ────────────────────────────────────────────────
async function tryOpenAI(
  imageBase64: string,
  prompt: string,
  stylePrompt: string,
  width?: number,
  height?: number
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const imageBuffer = Buffer.from(imageBase64, "base64");
  const imageFile = new File([new Uint8Array(imageBuffer)], "input.png", {
    type: "image/png",
  });

  const size = getOpenAISize(width, height);

  // GPT-image-1 images.edit without mask — used as fallback only.
  // Without mask the model is conservative, but combined with a strong
  // action-descriptive prompt it can still make surface changes.
  try {
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      n: 1,
      size,
      quality: "high",
      response_format: "b64_json",
    });

    const outputBase64 = response.data?.[0]?.b64_json;
    if (!outputBase64) {
      throw new Error("No image returned from OpenAI gpt-image-1");
    }

    return {
      image: `data:image/png;base64,${outputBase64}`,
      model: "OpenAI GPT-image-1",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("gpt-image-1 failed, trying dall-e-2:", msg);
  }

  // Fallback: dall-e-2 (256/512/1024 only)
  const dalleFile = new File([new Uint8Array(imageBuffer)], "input.png", {
    type: "image/png",
  });

  const response = await openai.images.edit({
    model: "dall-e-2",
    image: dalleFile,
    prompt: buildDalle2Prompt(stylePrompt),
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  });

  const outputBase64 = response.data?.[0]?.b64_json;
  if (!outputBase64) {
    throw new Error("No image returned from OpenAI dall-e-2");
  }

  return {
    image: `data:image/png;base64,${outputBase64}`,
    model: "OpenAI DALL-E 2",
  };
}

// ─── Replicate Fallback (SDXL img2img) ──────────────────────────────
async function tryReplicate(
  imageBase64: string,
  stylePrompt: string
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;

  // prompt_strength 0.50 = balanced edit.
  // 0.35 was too conservative (no visible changes).
  // 0.50 = 50% input preservation + 50% prompt influence — enough to change
  // surfaces (floor, walls, ceiling) while keeping room geometry.
  const output = await replicate.run(
    "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}:${string}`,
    {
      input: {
        image: dataUri,
        prompt: buildSDXLPrompt(stylePrompt),
        negative_prompt: SDXL_NEGATIVE_PROMPT,
        prompt_strength: 0.50,
        num_outputs: 1,
        guidance_scale: 8.5,
        num_inference_steps: 40,
        scheduler: "K_EULER",
      },
    }
  );

  const outputArray = output as string[];
  if (!outputArray || outputArray.length === 0) {
    throw new Error("No image returned from Replicate");
  }

  const imageUrl = outputArray[0];
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    model: "Replicate SDXL",
  };
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

    const prompt = buildGPTPrompt(stylePrompt.trim());

    // Try Replicate SDXL first (designed for img2img with prompt_strength control),
    // then OpenAI as fallback (images.edit is inpainting, not ideal for surface editing).
    let replicateError: Error | null = null;
    let openaiError: Error | null = null;

    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const result = await tryReplicate(base64Image, stylePrompt.trim());
        return NextResponse.json(result);
      } catch (err) {
        replicateError = err instanceof Error ? err : new Error(String(err));
        console.error("Replicate failed:", replicateError.message);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await tryOpenAI(base64Image, prompt, stylePrompt.trim(), width, height);
        return NextResponse.json(result);
      } catch (err) {
        openaiError = err instanceof Error ? err : new Error(String(err));
        console.error("OpenAI also failed:", openaiError.message);
      }
    }

    if (!process.env.REPLICATE_API_TOKEN && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Aucune clé API configurée. Veuillez configurer OPENAI_API_KEY ou REPLICATE_API_TOKEN." },
        { status: 500 }
      );
    }

    const details: string[] = [];
    if (replicateError) details.push(`Replicate : ${replicateError.message}`);
    if (openaiError) details.push(`OpenAI : ${openaiError.message}`);

    return NextResponse.json(
      { error: `Échec de la génération. ${details.join(" | ")}` },
      { status: 503 }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
