/**
 * Server-side image analysis utilities (uses sharp).
 *
 * IMPORTANT: this file is server-only. Do NOT import from client components.
 * Client-side image processing lives in `lib/image-utils.ts` (uses Canvas API).
 *
 * Sprint 25 (v55) — Diagnostic anomalie modèle gpt-image-1.5 :
 * Lucas Moreau a identifié un artefact de fusion catastrophique sur les pass1
 * dont l'input contient des zones très surexposées (baies vitrées cramées).
 * Hypothèse : `input_fidelity:"high"` traite ces zones >95% luminance comme du
 * contenu à préserver et les blende en alpha-overlay au lieu de les régénérer.
 *
 * Cette fonction permet de détecter ces inputs en amont du pipeline et de
 * basculer dynamiquement sur `input_fidelity:"low"` en passe 1.
 */

import sharp from "sharp";

export interface BlownHighlightsResult {
  /** Ratio de pixels >95% luminance (0-1). */
  ratio: number;
  /** True si le ratio dépasse le seuil (par défaut 5%). */
  hasBlownHighlights: boolean;
}

/** Seuil par défaut de luminance (0-255). 95% × 255 = 242. */
const LUMINANCE_THRESHOLD = 242;

/** Seuil par défaut de ratio de pixels surexposés au-delà duquel on flag. */
const DEFAULT_RATIO_THRESHOLD = 0.05;

/** Taille de l'image downsamplée pour l'analyse (rapide, ~10ms). */
const ANALYSIS_SIZE = 256;

/**
 * Détecte si une image contient des highlights cramés significatifs.
 *
 * Décode l'image en niveaux de gris (256x256 fit:fill), compte les pixels
 * dont la luminance dépasse `LUMINANCE_THRESHOLD` (~95%), et compare le
 * ratio au seuil `ratioThreshold`.
 *
 * Fail-open : en cas d'erreur de décodage, retourne `{ ratio: 0, hasBlownHighlights: false }`
 * pour ne JAMAIS bloquer le pipeline.
 *
 * @param buffer Buffer image (JPEG, PNG, WebP — tout ce que sharp décode).
 * @param ratioThreshold Seuil de ratio (défaut 0.05 = 5%).
 */
export async function detectBlownHighlights(
  buffer: Buffer,
  ratioThreshold: number = DEFAULT_RATIO_THRESHOLD
): Promise<BlownHighlightsResult> {
  try {
    const raw = await sharp(buffer)
      .resize(ANALYSIS_SIZE, ANALYSIS_SIZE, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer();

    let blownCount = 0;
    const total = raw.length;
    for (let i = 0; i < total; i++) {
      if (raw[i] >= LUMINANCE_THRESHOLD) blownCount++;
    }

    const ratio = total === 0 ? 0 : blownCount / total;
    return {
      ratio,
      hasBlownHighlights: ratio >= ratioThreshold,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[detectBlownHighlights] Failed (fail-open): ${msg}`);
    return { ratio: 0, hasBlownHighlights: false };
  }
}

/**
 * Variante qui accepte une chaîne base64 (avec ou sans préfixe data URI).
 */
export async function detectBlownHighlightsFromBase64(
  base64: string,
  ratioThreshold: number = DEFAULT_RATIO_THRESHOLD
): Promise<BlownHighlightsResult> {
  const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
  return detectBlownHighlights(Buffer.from(cleaned, "base64"), ratioThreshold);
}
