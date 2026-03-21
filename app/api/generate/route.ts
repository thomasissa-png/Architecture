import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";
import { deflateSync } from "zlib";

// ─── Transparent Mask Generator ──────────────────────────────────────
// GPT-image-1 images.edit WITHOUT a mask is ultra-conservative: it "retouches"
// instead of transforming. By sending a fully transparent mask, we tell the
// model "you can modify every pixel" — critical for virtual home staging.

function crc32(buf: Buffer): number {
  // CRC32 lookup table (standard polynomial 0xEDB88320)
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

/**
 * Creates a fully transparent PNG of given dimensions.
 * Every pixel is RGBA(0,0,0,0) → entire image is "editable" by images.edit.
 */
function createTransparentMask(width: number, height: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, 8-bit RGBA
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw scanlines: each row = 1 filter byte (0=None) + width*4 RGBA bytes (all 0 = transparent)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  // Buffer.alloc initializes to 0 → fully transparent

  const compressed = deflateSync(rawData);

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

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
// Strategy v3: DESCRIBE THE OUTPUT IMAGE, not editing instructions.
//
// Failed approaches:
//   v1 "TRANSFORM this room..." → model retouches minimally
//   v2 "ADD ALL OF THE FOLLOWING..." → model adds 1-2 accessories, ignores list
//   Both failed because images.edit treats prompts as retouching guidance.
//
// v3 insight: Describe the DESIRED FINAL IMAGE as if photographing an
// already-furnished room. The model fills in to match the description.
// Keep it short (~60 words) — long prompts dilute the visual signal.

function buildPrompt(stylePrompt: string): string {
  return `A stunning, fully furnished living room photographed for Architectural Digest. ${stylePrompt}. The room features a large sofa, coffee table, armchairs, a big area rug, curtains, floor and table lamps, framed art on the walls, potted plants, and styled side tables with books and candles. Clean finished walls and polished floors. Professional interior photography, DSLR wide-angle lens, natural daylight, photorealistic.`;
}

function buildDalle2Prompt(stylePrompt: string): string {
  const short = `A stunning fully furnished living room for Architectural Digest. ${stylePrompt}. Large sofa, coffee table, armchairs, area rug, curtains, floor lamp, table lamp, framed wall art, potted plants, side tables with books and candles. Clean walls, polished floors. Professional DSLR wide-angle interior photo, natural light, photorealistic.`;
  return short.slice(0, 1000);
}

function buildSDXLPrompt(stylePrompt: string): string {
  return `Stunning fully furnished living room, Architectural Digest. ${stylePrompt}. Large sofa, coffee table, armchairs, area rug, curtains, lamps, framed wall art, potted plants, styled side tables. Clean walls, polished floors. DSLR wide-angle interior photograph, natural daylight, photorealistic.`;
}

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

  // Create a fully transparent mask so GPT-image-1 knows it can modify everything.
  // Without this mask, images.edit is ultra-conservative and barely changes the input.
  const maskWidth = width || 1024;
  const maskHeight = height || 1024;
  const maskBuffer = createTransparentMask(maskWidth, maskHeight);
  const maskFile = new File([new Uint8Array(maskBuffer)], "mask.png", { type: "image/png" });

  // Try gpt-image-1 first (requires Usage Tier 1+)
  try {
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      mask: maskFile,
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

  // Fallback to dall-e-2 (available on all paid accounts)
  // dall-e-2 only supports 256x256, 512x512, 1024x1024
  const dalleFile = new File([imageBuffer], "input.png", {
    type: "image/png",
  });

  // dall-e-2 also benefits from a mask — create one at 1024x1024 (its max size)
  const dalleMask = createTransparentMask(1024, 1024);
  const dalleMaskFile = new File([new Uint8Array(dalleMask)], "mask.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "dall-e-2",
    image: dalleFile,
    mask: dalleMaskFile,
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

  // SDXL img2img: prompt_strength controls how much the prompt overrides the input.
  // 0.55 was too low — the model preserved the empty room too much.
  // 0.72 gives enough freedom to add real furniture while keeping room geometry.
  const output = await replicate.run(
    "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as `${string}/${string}:${string}`,
    {
      input: {
        image: dataUri,
        prompt: buildSDXLPrompt(stylePrompt),
        negative_prompt: SDXL_NEGATIVE_PROMPT,
        prompt_strength: 0.72,
        num_outputs: 1,
        guidance_scale: 8.5,
        num_inference_steps: 40,
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
