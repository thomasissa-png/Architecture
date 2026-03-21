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

// ─── Prompt Engineering (Audit Lucas Moreau — P0 to P7) ─────────────

// P0 — Photographic technical descriptors force camera-realistic output
// P7 — Deep DOF consistent with f/8 wide-angle (real estate standard: everything sharp)
const PHOTO_REALISM = "Shot on a professional full-frame DSLR with a 16-35mm wide-angle lens at f/8, deep depth of field with sharp focus throughout the entire room, natural ambient light, RAW photograph quality, color-accurate white balance, no HDR tonemapping artifacts.";

// P1 — Lighting coherence: added furniture must match the existing light
// P5 — Adaptive exposure conditions (dark rooms, blown windows)
const LIGHTING_COHERENCE = "Match the exact lighting conditions of the input photo: same light direction, shadow angles, shadow softness, highlight intensity, specular reflections on surfaces, and color temperature. All added furniture and objects must cast shadows fully consistent with the existing light sources visible or implied in the original image. If the room is dark or underexposed, keep the low-light mood but ensure furniture remains visible with subtle ambient fill. If windows are overexposed with blown highlights, preserve those bright areas as-is.";

// P2 — Real construction-site conditions clause
const SITE_CONDITIONS = "If the input photo shows a construction site, empty rough space, or unfinished room, interpret it as a room awaiting renovation. Add finished surfaces (fresh paint, clean floors) only where the chosen style requires, while keeping the exact room geometry, ceiling height, beams, and architectural volumes unchanged.";

// P6 — Condensed architectural constraints (3 phrases instead of 6, reduces token dilution)
const ARCHITECTURAL_CONSTRAINTS = [
  "Keep the exact room architecture completely unchanged: walls, floors, ceiling, beams, ceiling height, windows, doors, all fixed elements (outlets, switches, baseboards, radiators, built-in shelving, door handles) and all architectural volumes.",
  "Maintain the original perspective, vanishing points, lens distortion, and any reflections in windows, mirrors or glossy surfaces.",
  "Only add movable furniture and decor — ensure realistic scale using door handles (~1m) and outlets as references.",
].join(" ");

// P3 — Restructured prompt for GPT-image-1: action FIRST, then style, then photo intent, then constraints
function buildPrompt(stylePrompt: string): string {
  return [
    "Furnish and stage this empty room. Add furniture, rugs, plants, artwork, lighting fixtures and decorative objects.",
    `Style: ${stylePrompt}.`,
    "The result must look like a professional interior staging for a luxury real estate listing, curated and intentional.",
    PHOTO_REALISM,
    LIGHTING_COHERENCE,
    ARCHITECTURAL_CONSTRAINTS,
    SITE_CONDITIONS,
  ].join(" ");
}

// dall-e-2 has a 1000-character prompt limit — condensed version with photo descriptors
function buildDalle2Prompt(stylePrompt: string): string {
  const short = `Furnish and stage this empty room with furniture, rugs, plants and decor. Style: ${stylePrompt}. Professional DSLR photograph, 16-35mm wide-angle, f/8, deep focus, natural light. Luxury real estate staging. Keep all room architecture, walls, floors, ceiling, windows unchanged. Match existing lighting and shadows. If dark room, keep mood. Photorealistic, color-accurate.`;
  return short.slice(0, 1000);
}

// P4 — Dedicated SDXL prompt: shorter (~60 words), style-first, optimized for SDXL attention window
function buildSDXLPrompt(stylePrompt: string): string {
  return `Furnish and stage this empty room. ${stylePrompt}. Professional interior design photograph, DSLR 16-35mm wide-angle, f/8 deep focus, natural ambient light, photorealistic. Add furniture, rugs, plants, artwork and decor. Shadows and lighting match the original photo. Furniture scale realistic. RAW photo quality, color-accurate.`;
}

// P4 — Dedicated SDXL negative prompt: deduplicated, precise terms
const SDXL_NEGATIVE_PROMPT = "blurry, distorted, cartoon, painting, 3D render, changed architecture, altered room geometry, different perspective, floating furniture, unrealistic scale, watermark, text, oversaturated, flat lighting, shallow depth of field, bokeh";

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
        prompt_strength: 0.35,
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
