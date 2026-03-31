/**
 * Client-side image processing utilities.
 * Resizes and compresses images before sending to the API.
 */

const MAX_DIMENSION = 1536;
const JPEG_QUALITY = 0.85;

interface ProcessedImage {
  base64: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Loads a File into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Calculates the best API size string based on aspect ratio.
 * Returns a size compatible with OpenAI's image API.
 */
export function getApiSize(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.3) return "1536x1024"; // landscape
  if (ratio < 0.77) return "1024x1536"; // portrait
  return "1024x1024"; // square-ish
}

/**
 * Resizes and compresses an image file.
 * - Max dimension: 2048px (preserves aspect ratio)
 * - Output: JPEG at 85% quality as base64 data URI
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file);
  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down if exceeds max dimension
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height / width) * MAX_DIMENSION);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width / height) * MAX_DIMENSION);
      height = MAX_DIMENSION;
    }
  }

  // Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(img, 0, 0, width, height);

  // Export as JPEG base64
  const base64 = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  // Cleanup
  URL.revokeObjectURL(img.src);

  return { base64, width, height, originalWidth, originalHeight };
}

/**
 * Basic heuristic to check if an image likely depicts an interior room.
 * Analyzes color distribution — rooms tend to have large uniform areas (walls, floors).
 * Returns a confidence score 0-1.
 */
export async function isLikelyInterior(file: File): Promise<{ score: number; pass: boolean }> {
  const img = await loadImage(file);

  // Sample at low resolution for speed
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { score: 1, pass: true }; // fail open

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  URL.revokeObjectURL(img.src);

  // Heuristic 1: Color uniformity — interiors have large uniform patches
  // Count how many pixels are similar to their neighbors
  let similarNeighbors = 0;
  const threshold = 30; // color distance threshold
  const totalComparisons = (size - 1) * size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 1; x++) {
      const i = (y * size + x) * 4;
      const j = (y * size + x + 1) * 4;
      const diff = Math.abs(data[i] - data[j]) + Math.abs(data[i + 1] - data[j + 1]) + Math.abs(data[i + 2] - data[j + 2]);
      if (diff < threshold) similarNeighbors++;
    }
  }

  const uniformity = similarNeighbors / totalComparisons;

  // Heuristic 2: Interiors typically have a dominant warm/neutral palette
  // Check saturation distribution — interiors tend toward low-medium saturation
  let lowSatCount = 0;
  const totalPixels = size * size;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < 0.5) lowSatCount++;
  }
  const neutralRatio = lowSatCount / totalPixels;

  // Combined score (weighted)
  const score = uniformity * 0.5 + neutralRatio * 0.5;

  // Threshold: most interiors score > 0.4
  // Very colorful outdoor/abstract images score < 0.3
  return { score, pass: score > 0.25 };
}
