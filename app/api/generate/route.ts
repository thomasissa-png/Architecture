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
// PIPELINE 2 PASSES:
// Pass 1 (surfaces): Finish raw surfaces (walls, floor, ceiling) — NO furniture.
// Pass 2 (furniture): Add furniture and decoration to the finished room — NO surface changes.

// ── Pass 1: Surface finishing ────────────────────────────────────────
function buildSurfacesResponsesPrompt(stylePrompt: string): string {
  return [
    "Edit this photo of a room.",
    `Apply a ${stylePrompt} finish to the surfaces: refinish the floor, repaint or replaster walls and ceiling to match the style.`,
    "Preserve the exact color and texture of every wall surface from the input photo. Every wall must remain solid, continuous, and unbroken from floor to ceiling — identical to the input.",
    "Include baseboards, trim, and a ceiling light fixture consistent with the style.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no textiles, no decoration.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, and room proportions.",
    "Preserve the existing lighting conditions, light direction, shadow angles, color temperature, and exposure exactly as in the input photo.",
    "DSLR full-frame, wide-angle 16-35mm, f/8, deep depth of field, sharp focus throughout.",
  ].join(" ");
}

function buildSurfacesFluxPrompt(stylePrompt: string): string {
  return [
    `${stylePrompt} finished empty room interior.`,
    "Refinished floor, repainted walls, smooth ceiling with light fixture.",
    "Every wall is solid and unbroken from floor to ceiling, matching the original surfaces exactly.",
    "Completely empty room — no furniture, no rugs, no textiles, no decoration, no objects.",
    "Same room geometry, same proportions, same lighting conditions, same camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus.",
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────
function buildFurnitureResponsesPrompt(stylePrompt: string): string {
  return [
    `Place ${stylePrompt} furniture and decoration into this photo of a finished empty room.`,
    "Add a sofa or seating, a coffee table, a rug, shelving or storage, plants, and decorative objects appropriate for the style.",
    "Every wall, floor, ceiling, and painted surface must remain IDENTICAL to the input photo — same colors, same textures, same geometry.",
    "Every wall stays solid and unbroken. The architecture of the room is frozen — only furniture and objects are new.",
    "Furniture must sit naturally on the existing floor with correct perspective, scale, and shadow direction matching the existing light.",
    "Photo-realistic interior photograph, same camera angle, same lens distortion, same vanishing points, DSLR full-frame 16-35mm f/8, deep DOF.",
  ].join(" ");
}

function buildFurnitureFluxPrompt(stylePrompt: string): string {
  return [
    `${stylePrompt} furnished room interior.`,
    "Sofa, coffee table, rug, shelving, plants, and decorative objects placed naturally on the existing floor.",
    "Every wall, floor, and ceiling surface remains identical — same colors, same textures, solid and unbroken.",
    "Same room geometry, same proportions, same lighting, same camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus.",
  ].join(" ");
}

// ─── OpenAI Responses API (PRIMARY) ─────────────────────────────────
async function tryOpenAIResponses(
  imageBase64: string,
  stylePrompt: string,
  pass: 1 | 2
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
  pass: 1 | 2
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
  pass: 1 | 2
): Promise<{ image: string; model: string }> {
  let openaiError: Error | null = null;
  let replicateError: Error | null = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await tryOpenAIResponses(base64Image, stylePrompt, pass);
    } catch (err) {
      openaiError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenAI pass ${pass} failed:`, openaiError.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await tryFluxDepth(base64Image, stylePrompt, pass);
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
    const { image, stylePrompt } = body as {
      image: string;
      stylePrompt: string;
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

    // ── Pipeline 2 passes ────────────────────────────────────────────
    // Pass 1: Finish surfaces (walls, floor, ceiling) — room stays empty
    // Pass 2: Add furniture on the finished room — surfaces untouched
    const trimmedStyle = stylePrompt.trim();

    console.log("Starting pass 1 (surfaces)...");
    const pass1 = await generatePass(base64Image, trimmedStyle, 1);
    const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

    console.log("Starting pass 2 (furniture)...");
    const pass2 = await generatePass(pass1Base64, trimmedStyle, 2);

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
