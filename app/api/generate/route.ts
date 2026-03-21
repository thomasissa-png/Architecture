import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";

// ─── Rate Limiting (in-memory, IP-based) ────────────────────────────
// Note: On serverless (Vercel), this is per-instance and resets on cold starts.
// For production, replace with Redis/Upstash rate limiting.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function checkRateLimit(ip: string): boolean {
  // Lazy cleanup: remove expired entries when checking
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
// Strategy: FURNITURE-FIRST with explicit item list.
//
// Problem observed (Sprint 8): GPT-image-1 images.edit is ultra-conservative.
// On a construction-site photo (exposed wires, raw concrete), the model was:
//   - "Stylizing" electrical wires into decorative sculptures instead of hiding them
//   - Adding only 1-2 tiny accessories instead of real furniture
//   - Returning a still-empty room with smoothed surfaces
//
// Root cause: Even with "TRANSFORM", the model treats images.edit as minimal
// retouching. Constraint lines ("keep geometry unchanged") reinforce conservatism.
//
// Fix: Lead with an EXPLICIT furniture inventory (what + where), treat the room
// as a blank canvas to be furnished. Remove all "keep/preserve/unchanged" language
// — the model already preserves structure by default in images.edit mode.
// Add explicit instruction to HIDE construction elements behind furniture.

// GPT-image-1 prompt — furniture-inventory approach
function buildPrompt(stylePrompt: string): string {
  return [
    "You are a professional virtual home stager. Completely furnish and decorate this empty room.",
    "",
    "ADD ALL OF THE FOLLOWING FURNITURE AND DECOR:",
    "- A large sofa (3-seater) as the main seating piece, placed against a wall",
    "- A coffee table in front of the sofa",
    "- One or two armchairs facing the sofa",
    "- A large area rug under the seating arrangement",
    "- Curtains or drapes on every window",
    "- At least 2 lighting fixtures (floor lamp, table lamp, or pendant)",
    "- Wall art or framed prints on the walls",
    "- 2-3 decorative plants (potted, on floor or surfaces)",
    "- Side tables with books, candles, or decorative objects",
    "- Finished flooring (hardwood, tile or carpet) covering any raw concrete",
    "- Clean painted or finished walls covering any construction elements",
    "",
    `STYLE: ${stylePrompt}.`,
    "",
    "IMPORTANT: Any visible construction elements (exposed wires, electrical boxes, raw plaster joints, cables) must be completely hidden — covered by furniture, art, finished walls, or simply removed from the image.",
    "",
    "The result must look like a photo from an Architectural Digest feature — a fully lived-in, beautifully decorated room. Not an empty space with a few accessories.",
    "Photorealistic, DSLR wide-angle interior photograph, natural light with consistent shadows on all furniture.",
  ].join("\n");
}

// DALL-E 2 prompt — 1000 char limit
function buildDalle2Prompt(stylePrompt: string): string {
  const short = `Professional virtual home staging. Completely furnish this empty room with: large 3-seater sofa against a wall, coffee table, armchairs, large area rug, curtains on all windows, floor lamp and table lamp, wall art, potted plants, side tables with books and candles. Add finished hardwood flooring and clean painted walls. Hide all construction elements (wires, cables, raw plaster). Style: ${stylePrompt}. Result must look like Architectural Digest — fully decorated, not empty. Photorealistic DSLR wide-angle interior photo, natural light.`;
  return short.slice(0, 1000);
}

// SDXL prompt — style-first, explicit furniture list
function buildSDXLPrompt(stylePrompt: string): string {
  return `Luxury furnished interior, ${stylePrompt}. Large sofa, coffee table, armchairs, area rug, curtains, floor lamp, table lamp, wall art, potted plants, side tables with books. Finished hardwood floor, clean painted walls, no exposed wires. Professional real estate photograph, DSLR wide-angle, photorealistic, natural light, fully decorated room.`;
}

// SDXL negative prompt
const SDXL_NEGATIVE_PROMPT = "empty room, unfurnished, bare walls, no furniture, empty floor, construction site, exposed wires, electrical cables, raw concrete, raw plaster, unfinished, sparse, minimal furniture, blurry, cartoon, painting, 3D render, floating furniture, unrealistic scale, watermark, text, oversaturated, shallow depth of field, bokeh";

// ─── Aspect Ratio Detection ────────────────────────────────────────
function getOpenAISize(width?: number, height?: number): "1024x1024" | "1536x1024" | "1024x1536" {
  if (!width || !height) return "1024x1024";
  const ratio = width / height;
  if (ratio > 1.3) return "1536x1024"; // landscape
  if (ratio < 0.77) return "1024x1536"; // portrait
  return "1024x1024"; // square-ish
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

  // Client sends JPEG — label the File correctly
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const imageFile = new File([imageBuffer], "input.jpg", {
    type: "image/jpeg",
  });

  const size = getOpenAISize(width, height);

  // Try gpt-image-1 first (requires Usage Tier 1+)
  try {
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      n: 1,
      size,
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

  // Fallback to dall-e-2 (available on all paid accounts)
  // dall-e-2 only supports 256x256, 512x512, 1024x1024
  const dalleFile = new File([imageBuffer], "input.png", {
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

// ─── Replicate Fallback (SDXL img2img — proper image editing) ──────
async function tryReplicate(
  imageBase64: string,
  stylePrompt: string
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;

  // P4 — Use dedicated SDXL prompt (shorter, style-first) + deduplicated negative prompt
  const output = await replicate.run(
    "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}:${string}`,
    {
      input: {
        image: dataUri,
        prompt: buildSDXLPrompt(stylePrompt),
        negative_prompt: SDXL_NEGATIVE_PROMPT,
        prompt_strength: 0.55,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 35,
        scheduler: "K_EULER",
      },
    }
  );

  // SDXL returns an array of URLs
  const outputArray = output as string[];
  if (!outputArray || outputArray.length === 0) {
    throw new Error("No image returned from Replicate");
  }

  // Fetch the image and convert to base64
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
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de requ\u00eates. Veuillez patienter une minute avant de r\u00e9essayer." },
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

    // Strip data URI prefix if present
    const base64Image = image.replace(/^data:image\/[\w+]+;base64,/, "");

    // Check rough size (base64 is ~33% larger than binary)
    const estimatedSize = (base64Image.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image d\u00e9passe la taille maximale de 10 Mo" },
        { status: 413 }
      );
    }

    const prompt = buildPrompt(stylePrompt.trim());

    // Try OpenAI first, then Replicate as fallback
    let openaiError: Error | null = null;
    let replicateError: Error | null = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await tryOpenAI(base64Image, prompt, stylePrompt.trim(), width, height);
        return NextResponse.json(result);
      } catch (err) {
        openaiError = err instanceof Error ? err : new Error(String(err));
        console.error("OpenAI failed:", openaiError.message);
      }
    }

    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const result = await tryReplicate(base64Image, stylePrompt.trim());
        return NextResponse.json(result);
      } catch (err) {
        replicateError = err instanceof Error ? err : new Error(String(err));
        console.error("Replicate also failed:", replicateError.message);
      }
    }

    // Both failed or no keys — return detailed error for debugging
    if (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Aucune cl\u00e9 API configur\u00e9e. Veuillez configurer OPENAI_API_KEY ou REPLICATE_API_TOKEN.",
        },
        { status: 500 }
      );
    }

    // At least one key was present but both providers failed
    const details: string[] = [];
    if (openaiError) details.push(`OpenAI : ${openaiError.message}`);
    if (replicateError) details.push(`Replicate : ${replicateError.message}`);

    return NextResponse.json(
      {
        error: `\u00c9chec de la g\u00e9n\u00e9ration. ${details.join(" | ")}`,
      },
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
