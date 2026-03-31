/**
 * URL slug generation for annonces and dossiers.
 *
 * Produces SEO-friendly, human-readable URLs like:
 *   /annonce/dupont-immobilier-t3-60m2-nantes-ab12cd
 *   /dossier/dupont-immobilier-t3-60m2-nantes-ab12cd
 *
 * The shortId suffix (6 chars from UUID) ensures uniqueness.
 */

const MAX_SLUG_LENGTH = 80;

/**
 * Normalize a string into a URL-safe slug segment.
 * Handles accents, special characters, multiple spaces/dashes.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
    .replace(/\s+/g, "-")           // spaces to dashes
    .replace(/-+/g, "-")            // collapse multiple dashes
    .replace(/^-+|-+$/g, "");       // trim leading/trailing dashes
}

/**
 * Generate a URL slug from company name + title + short UUID.
 *
 * @param companyName - Merchant's raison_sociale (may be null/empty)
 * @param title - Annonce or dossier title (e.g. "T3 60 m2 -- Nantes")
 * @param shortId - First 6 characters of the UUID
 * @returns URL-safe slug, max 80 characters
 */
export function generateSlug(
  companyName: string | null | undefined,
  title: string | null | undefined,
  shortId: string
): string {
  const parts: string[] = [];

  if (companyName?.trim()) {
    parts.push(normalize(companyName.trim()));
  }

  if (title?.trim()) {
    // Clean up common patterns in titles
    const cleanTitle = title
      .replace(/—/g, "-")  // em-dash to hyphen
      .replace(/–/g, "-")  // en-dash to hyphen
      .replace(/m²/g, "m2") // m² to m2
      .trim();
    parts.push(normalize(cleanTitle));
  }

  // Always append shortId for uniqueness
  const suffix = shortId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);

  // Join parts and truncate
  let slug = parts.filter(Boolean).join("-");

  // Truncate to fit within max length (accounting for suffix)
  const maxBaseLength = MAX_SLUG_LENGTH - suffix.length - 1; // -1 for separator dash
  if (slug.length > maxBaseLength) {
    slug = slug.slice(0, maxBaseLength).replace(/-+$/, ""); // don't end on a dash
  }

  // If we have no meaningful base (no company, no title), just use the shortId
  if (!slug) {
    return suffix;
  }

  return `${slug}-${suffix}`;
}

/**
 * Extract the 6-char shortId from a UUID.
 * Uses the first 6 hex chars (from the first segment).
 */
export function extractShortId(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 6).toLowerCase();
}

/**
 * Check if a string looks like a UUID (v4 format).
 * Used to distinguish slug vs UUID in route params.
 */
export function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Resolve slug collisions by appending an incremental suffix.
 * Checks the given table for existing slugs and appends -2, -3, etc. if needed.
 *
 * @param db - pg Pool instance
 * @param tableName - "annonces" or "dossiers"
 * @param slug - the candidate slug
 * @returns a unique slug (original or with suffix)
 */
export async function resolveSlugCollision(
  db: { query: (text: string, values: unknown[]) => Promise<{ rowCount: number | null }> },
  tableName: string,
  slug: string
): Promise<string> {
  // Whitelist table names to prevent SQL injection
  const allowedTables = ["annonces", "dossiers"];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`resolveSlugCollision: invalid table "${tableName}"`);
  }

  // Check if the slug already exists
  const check = await db.query(
    `SELECT 1 FROM ${tableName} WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  if ((check.rowCount ?? 0) === 0) return slug;

  // Find next available suffix
  for (let i = 2; i <= 100; i++) {
    const candidate = `${slug}-${i}`;
    const exists = await db.query(
      `SELECT 1 FROM ${tableName} WHERE slug = $1 LIMIT 1`,
      [candidate]
    );
    if ((exists.rowCount ?? 0) === 0) return candidate;
  }

  // Extremely unlikely fallback: append random chars
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slug}-${rand}`;
}
