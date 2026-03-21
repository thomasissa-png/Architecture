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

// ─── Prompt Engineering ─────────────────────────────────────────────
const ARCHITECTURAL_CONSTRAINTS = [
  "Keep the exact room architecture, walls, floors, ceiling, windows, doors and lighting completely unchanged.",
  "Preserve all fixed elements: electrical outlets, light switches, baseboards, radiators, built-in shelving, door handles.",
  "Maintain the original perspective, vanishing points and lens distortion exactly.",
  "Respect the natural light direction, shadows and color temperature from the original photo.",
  "Only add movable furniture, soft furnishings (cushions, throws, rugs), decorative objects, plants and artwork.",
  "Ensure furniture scale is realistic relative to the room dimensions visible in the photo.",
  "The result must look like a high-end real estate photography with professional staging — photorealistic, not a 3D render.",
].join(" ");

const AVOID_TERMS = "Do not produce: blurry, distorted, cartoon, painting, 3D render, changed architecture, altered proportions, floating furniture, watermark or text.";

function buildPrompt(stylePrompt: string): string {
  return `${ARCHITECTURAL_CONSTRAINTS} Style: ${stylePrompt}. The staging should feel curated and intentional, as if done by a professional interior designer for a luxury real estate listing. ${AVOID_TERMS}`;
}

// dall-e-2 has a 1000-character prompt limit — use a condensed version
function buildDalle2Prompt(stylePrompt: string): string {
  const short = `Keep the exact room architecture, walls, floors, windows unchanged. Add furniture and decor only. Style: ${stylePrompt}. Professional interior staging, photorealistic, high-end real estate photography. No blurry, distorted, cartoon, 3D render, changed architecture, watermark.`;
  return short.slice(0, 1000);
}

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
  prompt: string
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;

  // Use stability-ai/sdxl in img2img mode with LOW prompt_strength
  // to preserve room architecture while adding furniture
  const output = await replicate.run(
    "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}:${string}`,
    {
      input: {
        image: dataUri,
        prompt: `Interior design photo, professionally staged room. ${prompt}`,
        negative_prompt:
          "blurry, distorted, different room, changed architecture, different perspective, unrealistic, cartoon, painting, 3D render, modified walls, modified windows, modified floor plan, changed ceiling, altered proportions, floating furniture, watermark, text",
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
        const result = await tryReplicate(base64Image, prompt);
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
