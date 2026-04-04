/**
 * Compositing serveur — superpose les zones structurelles de l'image originale
 * sur le résultat généré par l'IA pour garantir la préservation physique
 * des fenêtres, portes et équipements fixes.
 *
 * Approche :
 * 1. GPT-4.1-mini vision détecte les bounding boxes des éléments structurels
 * 2. sharp extrait ces zones de l'original et les compose sur le résultat
 * 3. Feathering (blur 3px sur les bords du masque) pour un blend naturel
 *
 * Fail-open : si quoi que ce soit échoue, retourne l'image générée telle quelle.
 */
import sharp from "sharp";
import OpenAI from "openai";

// ─── Types ──────────────────────────────────────────────────────────

interface BoundingBox {
  type: string;
  x: number;      // pourcentage (0-100) depuis le bord gauche
  y: number;      // pourcentage (0-100) depuis le bord haut
  width: number;  // pourcentage (0-100) de la largeur totale
  height: number; // pourcentage (0-100) de la hauteur totale
}

// ─── Constants ──────────────────────────────────────────────────────

const VISION_TIMEOUT_MS = 5_000;
// Feather radius proportional to image size (min 5px, ~8px on 1536w)
// 3px was too tight and caused visible seams on perspective misalignment
let FEATHER_RADIUS = 5;

const VISION_PROMPT = `Look at this photo of a room. Identify the bounding boxes of these structural elements:
- windows (including their frames)
- doors (including their frames)
- radiators, heaters, convectors
- water heaters (cylindrical tanks)
- electrical panels

Return ONLY a JSON array: [{"type": "window", "x": 10, "y": 5, "width": 30, "height": 40}]
where x, y, width, height are percentages (0-100) of the image dimensions.
x and y are the top-left corner of the bounding box.
If no structural elements are found, return [].
Be precise with the bounding boxes — they should tightly fit each element with a small margin (~2%).`;

// ─── Singleton OpenAI ───────────────────────────────────────────────

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ─── Detect MIME type from base64 prefix ────────────────────────────

function detectMime(base64: string): string {
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

// ─── Vision: detect structural bounding boxes ───────────────────────

async function detectStructuralElements(imageBase64: string): Promise<BoundingBox[]> {
  const openai = getOpenAI();
  const mimeType = detectMime(imageBase64);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  try {
    const response = await openai.chat.completions.create(
      {
        model: "gpt-4.1-mini",
        max_tokens: 500,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: VISION_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      },
      { signal: controller.signal },
    );

    clearTimeout(timer);

    const text = response.choices[0]?.message?.content?.trim() ?? "[]";
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("[compositing] No JSON array found in vision response:", text.substring(0, 200));
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    // Validate each bounding box
    const validated: BoundingBox[] = [];
    for (const box of parsed) {
      if (
        typeof box.type === "string" &&
        typeof box.x === "number" &&
        typeof box.y === "number" &&
        typeof box.width === "number" &&
        typeof box.height === "number" &&
        box.x >= 0 && box.x <= 100 &&
        box.y >= 0 && box.y <= 100 &&
        box.width > 0 && box.width <= 100 &&
        box.height > 0 && box.height <= 100
      ) {
        validated.push({
          type: box.type,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        });
      }
    }

    console.log(`[compositing] Detected ${validated.length} structural elements: ${validated.map(b => `${b.type}(${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)}x${Math.round(b.height)})`).join(", ") || "none"}`);
    return validated;
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[compositing] Vision detection failed (fail-open): ${msg}`);
    return [];
  }
}

// ─── Create a feathered mask for a bounding box ─────────────────────

async function createFeatheredMask(
  boxWidthPx: number,
  boxHeightPx: number,
): Promise<Buffer> {
  // Create a white rectangle (the zone to preserve)
  // with feathered (blurred) edges for smooth blending
  const mask = sharp(
    Buffer.from(
      `<svg width="${boxWidthPx}" height="${boxHeightPx}">
        <defs>
          <filter id="feather">
            <feGaussianBlur stdDeviation="${FEATHER_RADIUS}" />
          </filter>
        </defs>
        <rect x="${FEATHER_RADIUS}" y="${FEATHER_RADIUS}"
              width="${Math.max(1, boxWidthPx - FEATHER_RADIUS * 2)}"
              height="${Math.max(1, boxHeightPx - FEATHER_RADIUS * 2)}"
              fill="white" filter="url(#feather)" />
      </svg>`
    )
  ).png();

  return mask.toBuffer();
}

// ─── Main compositing function ──────────────────────────────────────

/**
 * Superpose les zones structurelles de l'image originale sur le résultat généré.
 *
 * @param originalBase64 - Image originale (avant génération) en base64 brut (sans data: prefix)
 * @param generatedBase64 - Image générée par l'IA en base64 brut (sans data: prefix)
 * @returns Image composite en base64 brut (sans data: prefix), ou generatedBase64 si rien à composer
 */
export async function compositeStructuralElements(
  originalBase64: string,
  generatedBase64: string,
): Promise<string> {
  try {
    // 1. Detect structural elements in the original image
    const boxes = await detectStructuralElements(originalBase64);

    if (boxes.length === 0) {
      console.log("[compositing] No structural elements detected — returning generated image as-is");
      return generatedBase64;
    }

    // 2. Load both images with sharp
    const originalBuffer = Buffer.from(originalBase64, "base64");
    const generatedBuffer = Buffer.from(generatedBase64, "base64");

    // Get dimensions from the generated image (it's the target canvas)
    const generatedMeta = await sharp(generatedBuffer).metadata();
    const imgWidth = generatedMeta.width!;
    const imgHeight = generatedMeta.height!;

    // Dynamic feather radius — proportional to image width, min 5px
    FEATHER_RADIUS = Math.max(5, Math.round(imgWidth * 0.005));

    // Resize original to match generated dimensions (they may differ slightly)
    const originalResized = await sharp(originalBuffer)
      .resize(imgWidth, imgHeight, { fit: "fill" })
      .toBuffer();

    // 3. For each bounding box, extract from original and compose onto generated
    // We build an array of composite operations
    const compositeOps: sharp.OverlayOptions[] = [];

    for (const box of boxes) {
      // Convert percentages to pixels
      const left = Math.round((box.x / 100) * imgWidth);
      const top = Math.round((box.y / 100) * imgHeight);
      const boxW = Math.round((box.width / 100) * imgWidth);
      const boxH = Math.round((box.height / 100) * imgHeight);

      // Clamp to image bounds
      const clampedLeft = Math.max(0, left);
      const clampedTop = Math.max(0, top);
      const clampedW = Math.min(boxW, imgWidth - clampedLeft);
      const clampedH = Math.min(boxH, imgHeight - clampedTop);

      if (clampedW < 5 || clampedH < 5) continue; // Skip tiny boxes

      // Extract the zone from the original
      const extractedRegion = await sharp(originalResized)
        .extract({ left: clampedLeft, top: clampedTop, width: clampedW, height: clampedH })
        .toBuffer();

      // Create a feathered mask for smooth blending
      const mask = await createFeatheredMask(clampedW, clampedH);

      // Apply the mask as alpha channel to the extracted region
      // This creates a feathered version of the original zone
      const maskedRegion = await sharp(extractedRegion)
        .ensureAlpha()
        .composite([
          {
            input: await sharp(mask)
              .resize(clampedW, clampedH, { fit: "fill" })
              .toBuffer(),
            blend: "dest-in" as const,
          },
        ])
        .png()
        .toBuffer();

      compositeOps.push({
        input: maskedRegion,
        left: clampedLeft,
        top: clampedTop,
        blend: "over" as const,
      });
    }

    if (compositeOps.length === 0) {
      console.log("[compositing] All bounding boxes too small — returning generated image as-is");
      return generatedBase64;
    }

    // 4. Compose all structural zones onto the generated image
    const result = await sharp(generatedBuffer)
      .ensureAlpha()
      .composite(compositeOps)
      .jpeg({ quality: 92 })
      .toBuffer();

    const resultBase64 = result.toString("base64");
    console.log(`[compositing] Composited ${compositeOps.length} structural zones onto generated image`);

    return resultBase64;
  } catch (err) {
    // Fail-open: return the generated image as-is
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[compositing] Failed (fail-open): ${msg}`);
    return generatedBase64;
  }
}
