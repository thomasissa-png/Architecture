/**
 * Simple image comparison metrics (server-side, no heavy dependencies).
 *
 * - pixelDiffPercentage: % of pixels whose RGB distance exceeds a threshold.
 * - colorShiftScore: average absolute difference between color histograms (0-255 bins).
 *
 * Both functions accept raw pixel buffers (RGBA, 4 bytes/pixel) or base64 PNG/JPEG
 * decoded via the built-in `sharp`-free approach using raw buffer math.
 *
 * NOTE: We decode PNG/JPEG to raw RGBA via a lightweight approach.
 * Since this runs on Node, we use the `sharp` package if available,
 * otherwise fall back to a basic JPEG/PNG decode. For Replit, sharp is
 * typically available via Next.js image optimization.
 */

// We rely on sharp being available in the Next.js environment (it ships with next).
// eslint-disable-next-line @typescript-eslint/no-require-imports
import sharp from "sharp";

const PIXEL_DIFF_THRESHOLD = 30; // out of 255

export interface ImageMetrics {
  pixelDiffPct: number;    // 0-100
  colorShiftScore: number; // 0-255 (average histogram distance)
}

/**
 * Decode a base64-encoded image (PNG or JPEG) to raw RGBA pixel buffer.
 */
async function decodeToRGBA(base64: string): Promise<{ data: Buffer; width: number; height: number }> {
  const buf = Buffer.from(base64, "base64");
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/**
 * Compute a 256-bin histogram for each RGB channel.
 */
function computeHistogram(data: Buffer, pixelCount: number): { r: Float64Array; g: Float64Array; b: Float64Array } {
  const r = new Float64Array(256);
  const g = new Float64Array(256);
  const b = new Float64Array(256);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    r[data[offset]]++;
    g[data[offset + 1]]++;
    b[data[offset + 2]]++;
  }

  // Normalize to probability distribution
  for (let i = 0; i < 256; i++) {
    r[i] /= pixelCount;
    g[i] /= pixelCount;
    b[i] /= pixelCount;
  }

  return { r, g, b };
}

/**
 * Compare two images and return simple metrics.
 * Both images are base64 strings (without data URI prefix).
 * If images have different dimensions, the second is resized to match the first.
 */
export async function compareImages(base64A: string, base64B: string): Promise<ImageMetrics> {
  const imgA = await decodeToRGBA(base64A);
  let imgB = await decodeToRGBA(base64B);

  // Resize B to match A if dimensions differ
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    const resized = await sharp(Buffer.from(base64B, "base64"))
      .resize(imgA.width, imgA.height, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    imgB = { data: resized.data, width: resized.info.width, height: resized.info.height };
  }

  const pixelCount = imgA.width * imgA.height;

  // 1. Pixel diff percentage
  let diffPixels = 0;
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const dr = Math.abs(imgA.data[offset] - imgB.data[offset]);
    const dg = Math.abs(imgA.data[offset + 1] - imgB.data[offset + 1]);
    const db = Math.abs(imgA.data[offset + 2] - imgB.data[offset + 2]);
    // If any channel differs beyond threshold, count as different
    if (dr > PIXEL_DIFF_THRESHOLD || dg > PIXEL_DIFF_THRESHOLD || db > PIXEL_DIFF_THRESHOLD) {
      diffPixels++;
    }
  }
  const pixelDiffPct = (diffPixels / pixelCount) * 100;

  // 2. Color histogram shift (average L1 distance across RGB channels)
  const histA = computeHistogram(imgA.data, pixelCount);
  const histB = computeHistogram(imgB.data, pixelCount);

  let totalDist = 0;
  for (let i = 0; i < 256; i++) {
    totalDist += Math.abs(histA.r[i] - histB.r[i]);
    totalDist += Math.abs(histA.g[i] - histB.g[i]);
    totalDist += Math.abs(histA.b[i] - histB.b[i]);
  }
  // Normalize: max L1 distance for one channel probability distribution is 2.0
  // Across 3 channels: max = 6.0. Scale to 0-255 for readability.
  const colorShiftScore = (totalDist / 6.0) * 255;

  return {
    pixelDiffPct: Math.round(pixelDiffPct * 100) / 100,
    colorShiftScore: Math.round(colorShiftScore * 100) / 100,
  };
}
