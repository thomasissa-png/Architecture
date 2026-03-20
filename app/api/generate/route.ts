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

// Periodic cleanup to prevent memory leaks (every 5 min)
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now();
    rateLimitMap.forEach((entry, ip) => {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    });
  };
  setInterval(cleanup, 5 * 60_000).unref?.();
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

function buildPrompt(stylePrompt: string): string {
  return `${ARCHITECTURAL_CONSTRAINTS} Style: ${stylePrompt}. The staging should feel curated and intentional, as if done by a professional interior designer for a luxury real estate listing. ${AVOID_TERMS}`;
}

const AVOID_TERMS = "Do not produce: blurry, distorted, cartoon, painting, 3D render, changed architecture, altered proportions, floating furniture, watermark or text.";

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
  width?: number,
  height?: number
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const imageBuffer = Buffer.from(imageBase64, "base64");
  const imageFile = new File([imageBuffer], "input.png", {
    type: "image/png",
  });

  const size = getOpenAISize(width, height);

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size,
  });

  const outputBase64 = response.data?.[0]?.b64_json;
  if (!outputBase64) {
    throw new Error("No image returned from OpenAI");
  }

  return {
    image: `data:image/png;base64,${outputBase64}`,
    model: "OpenAI GPT-image-1",
  };
}

// ─── Replicate Fallback (Flux for inpainting) ──────────────────────
async function tryReplicate(
  imageBase64: string,
  prompt: string
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/png;base64,${imageBase64}`;

  const output = await replicate.run(
    "black-forest-labs/flux-1.1-pro" as `${string}/${string}`,
    {
      input: {
        prompt: prompt,
        image: dataUri,
        prompt_upsampling: true,
        num_outputs: 1,
        output_format: "png",
        guidance: 3.5,
        steps: 28,
      },
    }
  );

  // Flux returns a URL or array of URLs
  const outputUrl = Array.isArray(output) ? output[0] : output;
  if (!outputUrl || typeof outputUrl !== "string") {
    throw new Error("No image returned from Replicate");
  }

  // Fetch and convert to base64
  const imageResponse = await fetch(outputUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    model: "Flux 1.1 Pro",
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

    if (!image || !stylePrompt) {
      return NextResponse.json(
        { error: "Image et style requis" },
        { status: 400 }
      );
    }

    // Strip data URI prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    // Check rough size (base64 is ~33% larger than binary)
    const estimatedSize = (base64Image.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image d\u00e9passe la taille maximale de 10 Mo" },
        { status: 413 }
      );
    }

    const prompt = buildPrompt(stylePrompt);

    // Try OpenAI first, then Replicate as fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await tryOpenAI(base64Image, prompt, width, height);
        return NextResponse.json(result);
      } catch (openaiError) {
        console.error("OpenAI failed, trying Replicate fallback:", openaiError);
      }
    }

    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const result = await tryReplicate(base64Image, prompt);
        return NextResponse.json(result);
      } catch (replicateError) {
        console.error("Replicate also failed:", replicateError);
        return NextResponse.json(
          {
            error:
              "Les deux services de g\u00e9n\u00e9ration sont indisponibles. Veuillez r\u00e9essayer plus tard.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Aucune cl\u00e9 API configur\u00e9e. Veuillez configurer OPENAI_API_KEY ou REPLICATE_API_TOKEN.",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
