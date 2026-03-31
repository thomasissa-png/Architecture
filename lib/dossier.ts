/**
 * F4 — Mode Pro (ex Mode Marchand): Dossier de pré-commercialisation.
 *
 * Types + CRUD DB functions for dossiers and dossier photos.
 * Max 15 photos/dossier. 1 photo = 1 credit. Pack Pro minimum required.
 */

import { getPool, ensureTable } from "@/lib/db";
import { generateSlug, extractShortId, resolveSlugCollision } from "@/lib/slug";

// ─── Types ───────────────────────────────────────────────────────────

export type DossierStatus = "draft" | "generating" | "completed" | "partial" | "archived";
export type DossierPhotoStatus = "pending" | "generating" | "completed" | "failed";

export interface Dossier {
  id: number;
  uuid: string;
  slug: string | null;
  user_id: string;
  bien_nom: string | null;
  bien_adresse: string | null;
  bien_surface: number | null;
  bien_prix: number | null;
  bien_type: string | null;
  global_style_id: string | null;
  status: DossierStatus;
  photo_count: number;
  success_count: number;
  fail_count: number;
  total_duration_ms: number | null;
  pdf_storage_key: string | null;
  latitude: number | null;
  longitude: number | null;
  ville: string | null;
  code_postal: string | null;
  description_commerciale: string | null;
  carte_image_key: string | null;
  prix_moyen_m2: number | null;
  nb_pieces: number | null;
  created_at: string;
  expires_at: string;
}

export interface DossierPhoto {
  id: number;
  dossier_uuid: string;
  photo_index: number;
  room_label: string | null;
  room_type_id: string | null;
  style_id: string | null;
  custom_prompt: string | null;
  is_outdoor: boolean;
  input_image_key: string | null;
  output_image_key: string | null;
  pass1_image_key: string | null;
  status: DossierPhotoStatus;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface CreateDossierInput {
  userId: string;
  bienNom?: string;
  bienAdresse?: string;
  bienSurface?: number;
  bienPrix?: number;
  bienType?: string;
  globalStyleId?: string;
  latitude?: number;
  longitude?: number;
  ville?: string;
  codePostal?: string;
  descriptionCommerciale?: string;
  carteImageKey?: string;
  prixMoyenM2?: number;
  nbPieces?: number;
  companyName?: string | null;
}

export interface DossierPhotoInput {
  dossierUuid: string;
  photoIndex: number;
  roomLabel?: string;
  roomTypeId?: string;
  styleId?: string;
  customPrompt?: string;
  isOutdoor?: boolean;
  inputImageKey: string;
}

// ─── Constants ───────────────────────────────────────────────────────

export const MAX_PHOTOS_PER_DOSSIER = 15;
export const MAX_CONCURRENT_GENERATIONS = 3;
export const DOSSIER_TTL_DAYS = 30;

// ─── DB Schema Migration ────────────────────────────────────────────

let dossierTablesEnsured = false;

export async function ensureDossierTables(): Promise<void> {
  if (dossierTablesEnsured) return;
  await ensureTable(); // Ensure base tables exist first

  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS dossiers (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      bien_nom VARCHAR(255),
      bien_adresse TEXT,
      bien_surface INTEGER,
      bien_prix INTEGER,
      bien_type VARCHAR(50),
      global_style_id VARCHAR(50),
      status VARCHAR(20) DEFAULT 'draft',
      photo_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      total_duration_ms INTEGER,
      pdf_storage_key VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
    );
    CREATE INDEX IF NOT EXISTS idx_dossiers_uuid ON dossiers (uuid);
    CREATE INDEX IF NOT EXISTS idx_dossiers_user ON dossiers (user_id);
    CREATE INDEX IF NOT EXISTS idx_dossiers_expires ON dossiers (expires_at);

    CREATE TABLE IF NOT EXISTS dossier_photos (
      id SERIAL PRIMARY KEY,
      dossier_uuid VARCHAR(36) REFERENCES dossiers(uuid) ON DELETE CASCADE,
      photo_index INTEGER NOT NULL,
      room_label VARCHAR(100),
      room_type_id VARCHAR(50),
      style_id VARCHAR(50),
      is_outdoor BOOLEAN DEFAULT false,
      input_image_key VARCHAR(255),
      output_image_key VARCHAR(255),
      pass1_image_key VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending',
      error_message TEXT,
      duration_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_dossier_photos_uuid ON dossier_photos (dossier_uuid);
  `);

  // ── Slug column (idempotent migration) ──
  await db.query(`
    DO $$ BEGIN ALTER TABLE dossiers ADD COLUMN slug TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_dossiers_slug ON dossiers (slug) WHERE slug IS NOT NULL;
  `);

  // ── Backfill slugs for dossiers without one ──
  const missingSlugRows = await db.query(
    `SELECT uuid, bien_nom, bien_adresse FROM dossiers WHERE slug IS NULL LIMIT 50`
  );
  for (const row of missingSlugRows.rows) {
    const shortId = extractShortId(row.uuid);
    const slugTitle = row.bien_nom || row.bien_adresse || null;
    let slug = generateSlug(null, slugTitle, shortId);
    slug = await resolveSlugCollision(db, "dossiers", slug);
    await db.query(`UPDATE dossiers SET slug = $1 WHERE uuid = $2`, [slug, row.uuid]);
  }

  // ── F4.B: Enrichment columns (address geocoding, DVF, description, map) ──
  const enrichColumns = [
    { name: "latitude", type: "DECIMAL(10,7)" },
    { name: "longitude", type: "DECIMAL(10,7)" },
    { name: "ville", type: "VARCHAR(100)" },
    { name: "code_postal", type: "VARCHAR(10)" },
    { name: "description_commerciale", type: "TEXT" },
    { name: "carte_image_key", type: "VARCHAR(255)" },
    { name: "prix_moyen_m2", type: "INTEGER" },
    { name: "nb_pieces", type: "INTEGER" },
  ];
  const enrichSql = enrichColumns
    .map(
      (col) =>
        `DO $$ BEGIN ALTER TABLE dossiers ADD COLUMN ${col.name} ${col.type}; EXCEPTION WHEN duplicate_column THEN NULL; END $$`
    )
    .join("; ");
  await db.query(enrichSql);

  // ── custom_prompt column on dossier_photos (idempotent migration) ──
  await db.query(`
    DO $$ BEGIN ALTER TABLE dossier_photos ADD COLUMN custom_prompt TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
  `);

  dossierTablesEnsured = true;
}

// ─── UUID generation ─────────────────────────────────────────────────

export function generateUUID(): string {
  return crypto.randomUUID();
}

// ─── CRUD Functions ──────────────────────────────────────────────────

export async function createDossier(input: CreateDossierInput): Promise<Dossier> {
  await ensureDossierTables();
  const db = getPool();
  const uuid = generateUUID();
  const shortId = extractShortId(uuid);

  // Build a title for the slug from available info
  const slugTitle = input.bienNom || input.bienAdresse || null;
  let slug = generateSlug(input.companyName, slugTitle, shortId);
  slug = await resolveSlugCollision(db, "dossiers", slug);

  const result = await db.query(
    `INSERT INTO dossiers (uuid, slug, user_id, bien_nom, bien_adresse, bien_surface, bien_prix, bien_type, global_style_id,
       latitude, longitude, ville, code_postal, description_commerciale, carte_image_key, prix_moyen_m2, nb_pieces)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [
      uuid,
      slug,
      input.userId,
      input.bienNom || null,
      input.bienAdresse || null,
      input.bienSurface || null,
      input.bienPrix || null,
      input.bienType || null,
      input.globalStyleId || null,
      input.latitude || null,
      input.longitude || null,
      input.ville || null,
      input.codePostal || null,
      input.descriptionCommerciale || null,
      input.carteImageKey || null,
      input.prixMoyenM2 || null,
      input.nbPieces || null,
    ]
  );

  return result.rows[0] as Dossier;
}

export async function getDossierByUuid(uuid: string): Promise<Dossier | null> {
  await ensureDossierTables();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM dossiers WHERE uuid = $1`,
    [uuid]
  );
  return (result.rows[0] as Dossier) ?? null;
}

export async function getDossierBySlug(slug: string): Promise<Dossier | null> {
  await ensureDossierTables();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM dossiers WHERE slug = $1`,
    [slug]
  );
  return (result.rows[0] as Dossier) ?? null;
}

/**
 * Resolve identifier: try slug first (faster, indexed), then UUID.
 * Returns the dossier and whether a redirect to slug is needed.
 */
export async function getDossierByIdentifier(
  identifier: string
): Promise<{ dossier: Dossier | null; redirectToSlug: boolean }> {
  // Try slug first (most common case for new links)
  const bySlug = await getDossierBySlug(identifier);
  if (bySlug) return { dossier: bySlug, redirectToSlug: false };

  // Try UUID (backward compat for old links)
  const byUuid = await getDossierByUuid(identifier);
  if (byUuid && byUuid.slug) {
    return { dossier: byUuid, redirectToSlug: true };
  }

  // UUID found but no slug yet — serve without redirect
  if (byUuid) return { dossier: byUuid, redirectToSlug: false };

  return { dossier: null, redirectToSlug: false };
}

export async function getDossiersByUser(userId: string, includeArchived = false): Promise<Dossier[]> {
  await ensureDossierTables();
  const db = getPool();
  const query = includeArchived
    ? `SELECT * FROM dossiers WHERE user_id = $1 ORDER BY created_at DESC`
    : `SELECT * FROM dossiers WHERE user_id = $1 AND (status IS NULL OR status != 'archived') ORDER BY created_at DESC`;
  const result = await db.query(query, [userId]);
  return result.rows as Dossier[];
}

export async function archiveDossier(uuid: string, userId: string): Promise<boolean> {
  await ensureDossierTables();
  const db = getPool();
  const result = await db.query(
    `UPDATE dossiers SET status = 'archived' WHERE uuid = $1 AND user_id = $2 AND status != 'archived' RETURNING id`,
    [uuid, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function unarchiveDossier(uuid: string, userId: string): Promise<boolean> {
  await ensureDossierTables();
  const db = getPool();
  const result = await db.query(
    `UPDATE dossiers SET status = 'completed' WHERE uuid = $1 AND user_id = $2 AND status = 'archived' RETURNING id`,
    [uuid, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function updateDossierStatus(
  uuid: string,
  status: DossierStatus,
  updates?: {
    successCount?: number;
    failCount?: number;
    totalDurationMs?: number;
    pdfStorageKey?: string;
  }
): Promise<void> {
  await ensureDossierTables();
  const db = getPool();

  const setClauses = ["status = $2"];
  const values: (string | number | null)[] = [uuid, status];
  let paramIndex = 3;

  if (updates?.successCount !== undefined) {
    setClauses.push(`success_count = $${paramIndex}`);
    values.push(updates.successCount);
    paramIndex++;
  }
  if (updates?.failCount !== undefined) {
    setClauses.push(`fail_count = $${paramIndex}`);
    values.push(updates.failCount);
    paramIndex++;
  }
  if (updates?.totalDurationMs !== undefined) {
    setClauses.push(`total_duration_ms = $${paramIndex}`);
    values.push(updates.totalDurationMs);
    paramIndex++;
  }
  if (updates?.pdfStorageKey !== undefined) {
    setClauses.push(`pdf_storage_key = $${paramIndex}`);
    values.push(updates.pdfStorageKey);
    paramIndex++;
  }

  await db.query(
    `UPDATE dossiers SET ${setClauses.join(", ")} WHERE uuid = $1`,
    values
  );
}

export async function deleteDossier(uuid: string): Promise<void> {
  await ensureDossierTables();
  const db = getPool();
  // CASCADE will delete photos
  await db.query(`DELETE FROM dossiers WHERE uuid = $1`, [uuid]);
}

// ─── Photo CRUD ──────────────────────────────────────────────────────

export async function addDossierPhoto(input: DossierPhotoInput): Promise<DossierPhoto> {
  await ensureDossierTables();
  const db = getPool();

  const result = await db.query(
    `INSERT INTO dossier_photos (dossier_uuid, photo_index, room_label, room_type_id, style_id, custom_prompt, is_outdoor, input_image_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.dossierUuid,
      input.photoIndex,
      input.roomLabel || null,
      input.roomTypeId || null,
      input.styleId || null,
      input.customPrompt || null,
      input.isOutdoor || false,
      input.inputImageKey,
    ]
  );

  // Update photo_count on dossier
  await db.query(
    `UPDATE dossiers SET photo_count = photo_count + 1 WHERE uuid = $1`,
    [input.dossierUuid]
  );

  return result.rows[0] as DossierPhoto;
}

export async function getDossierPhotos(dossierUuid: string): Promise<DossierPhoto[]> {
  await ensureDossierTables();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM dossier_photos WHERE dossier_uuid = $1 ORDER BY photo_index ASC`,
    [dossierUuid]
  );
  return result.rows as DossierPhoto[];
}

export async function updateDossierPhotoStatus(
  photoId: number,
  status: DossierPhotoStatus,
  updates?: {
    outputImageKey?: string;
    pass1ImageKey?: string;
    errorMessage?: string;
    durationMs?: number;
  }
): Promise<void> {
  await ensureDossierTables();
  const db = getPool();

  const setClauses = ["status = $2"];
  const values: (string | number | null)[] = [photoId, status];
  let paramIndex = 3;

  if (updates?.outputImageKey !== undefined) {
    setClauses.push(`output_image_key = $${paramIndex}`);
    values.push(updates.outputImageKey);
    paramIndex++;
  }
  if (updates?.pass1ImageKey !== undefined) {
    setClauses.push(`pass1_image_key = $${paramIndex}`);
    values.push(updates.pass1ImageKey);
    paramIndex++;
  }
  if (updates?.errorMessage !== undefined) {
    setClauses.push(`error_message = $${paramIndex}`);
    values.push(updates.errorMessage);
    paramIndex++;
  }
  if (updates?.durationMs !== undefined) {
    setClauses.push(`duration_ms = $${paramIndex}`);
    values.push(updates.durationMs);
    paramIndex++;
  }

  await db.query(
    `UPDATE dossier_photos SET ${setClauses.join(", ")} WHERE id = $1`,
    values
  );
}

export async function updateDossierPhotoStyle(
  photoId: number,
  styleId: string,
  isOutdoor: boolean = false
): Promise<void> {
  await ensureDossierTables();
  const db = getPool();
  await db.query(
    `UPDATE dossier_photos SET style_id = $2, is_outdoor = $3 WHERE id = $1`,
    [photoId, styleId, isOutdoor]
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function isDossierExpired(dossier: Dossier): boolean {
  return new Date(dossier.expires_at) < new Date();
}

export function getDossierTitle(dossier: Dossier): string {
  // Format A (creative-strategy): "T3 60 m² — Quartier, Ville"
  const pieces = dossier.nb_pieces ? `T${dossier.nb_pieces}` : null;
  const surface = dossier.bien_surface ? `${dossier.bien_surface} m²` : null;
  const ville = dossier.ville?.trim() || null;

  // Prefer short address (city quarter or short street) over full address
  const adresse = dossier.bien_adresse?.trim() || null;
  // Extract short form: last part before city, or first meaningful part
  const shortAddr = adresse && ville && adresse.includes(ville)
    ? adresse.replace(ville, "").replace(/,\s*$/, "").trim() || null
    : adresse || null;

  // Build location: "Rue Henri Barbusse, Le Mans" or just "Le Mans"
  const location = shortAddr && ville
    ? `${shortAddr}, ${ville}`
    : shortAddr || ville || null;

  // Build property part: "T3 60 m²" or "T3" or "60 m²"
  const propertyParts = [pieces, surface].filter(Boolean).join(" ");

  if (propertyParts && location) {
    return `${propertyParts} — ${location}`;
  }
  if (propertyParts) {
    return propertyParts;
  }
  if (location) {
    return location;
  }

  // Fallback: use bien_nom if set, otherwise generic
  if (dossier.bien_nom?.trim()) return dossier.bien_nom.trim();
  return "Dossier de présentation";
}

export function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceCents);
}

export function formatSurface(surface: number): string {
  return `${surface} m²`;
}
