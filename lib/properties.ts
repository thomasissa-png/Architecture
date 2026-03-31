/**
 * Properties (Biens) — Entité persistante pour le Mode Pro (ex Mode Marchand).
 *
 * Un bien = une adresse + enrichissement API (geocoding, DVF, carte, description).
 * Plusieurs photos (user_photos) peuvent etre associees a un bien.
 * Plusieurs dossiers peuvent etre generes depuis les photos d'un bien.
 */

import { getPool, ensureTable } from "@/lib/db";
import { ensureUserPhotosTable } from "@/lib/user-photos";
import { ensureDossierTables } from "@/lib/dossier";
import { ensureAnnonceTable } from "@/lib/annonce";

// ─── Types ───────────────────────────────────────────────────────────

export interface Property {
  id: string;
  user_id: string;
  address_raw: string | null;
  address_normalized: string | null;
  latitude: number | null;
  longitude: number | null;
  commune_code: string | null;
  postal_code: string | null;
  city: string | null;
  property_type: string | null;
  room_count: number | null;
  surface_m2: number | null;
  floor_number: string | null;
  dvf_median_price_m2: number | null;
  dvf_period: string | null;
  map_image_key: string | null;
  description_generated: string | null;
  description_final: string | null;
  sale_price: number | null;
  dpe_classe: string | null;
  ges_classe: string | null;
  etage: number | null;
  ascenseur: boolean | null;
  parking: boolean | null;
  cave: boolean | null;
  charges_copro_annuelles: number | null;
  annee_construction: number | null;
  exposition: string | null;
  taxe_fonciere: number | null;
  nb_lots_copro: number | null;
  photo_count?: number;
  dossier_count?: number;
  annonce_uuid?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyInput {
  userId: string;
  addressRaw: string;
  propertyType?: string | null;
  roomCount?: number | null;
  surfaceM2?: number | null;
  floorNumber?: string | null;
  salePrice?: number | null;
}

export interface UpdatePropertyInput {
  addressRaw?: string;
  addressNormalized?: string;
  latitude?: number;
  longitude?: number;
  communeCode?: string;
  postalCode?: string;
  city?: string;
  propertyType?: string;
  roomCount?: number;
  surfaceM2?: number;
  floorNumber?: string;
  dvfMedianPriceM2?: number;
  dvfPeriod?: string;
  mapImageKey?: string;
  descriptionGenerated?: string;
  descriptionFinal?: string;
  salePrice?: number;
  dpeClasse?: string;
  gesClasse?: string;
  etage?: number;
  ascenseur?: boolean;
  parking?: boolean;
  cave?: boolean;
  chargesCoproAnnuelles?: number;
  anneeConstruction?: number;
  exposition?: string;
  taxeFonciere?: number;
  nbLotsCopro?: number;
}

// ─── DB Schema Migration ────────────────────────────────────────────

let propertiesTableEnsured = false;

export async function ensurePropertiesTable(): Promise<void> {
  if (propertiesTableEnsured) return;
  await ensureTable();
  // Ensure dependent tables exist — subqueries in getPropertiesByUser/getPropertyById
  // reference user_photos, dossiers, and annonces tables.
  await Promise.all([ensureUserPhotosTable(), ensureDossierTables(), ensureAnnonceTable()]);

  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      address_raw TEXT,
      address_normalized TEXT,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      commune_code VARCHAR(5),
      postal_code VARCHAR(5),
      city VARCHAR(255),
      property_type VARCHAR(50),
      room_count INTEGER,
      surface_m2 INTEGER,
      floor_number VARCHAR(10),
      dvf_median_price_m2 INTEGER,
      dvf_period VARCHAR(50),
      map_image_key VARCHAR(255),
      description_generated TEXT,
      description_final TEXT,
      sale_price INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_properties_user ON properties (user_id);
  `);

  // ─── Migrate: add property detail columns (Sprint Benchmark Marc) ───
  const migratePropertyColumns = [
    { name: "dpe_classe", type: "VARCHAR(1)" },
    { name: "ges_classe", type: "VARCHAR(1)" },
    { name: "etage", type: "INTEGER" },
    { name: "ascenseur", type: "BOOLEAN" },
    { name: "parking", type: "BOOLEAN" },
    { name: "cave", type: "BOOLEAN" },
    { name: "charges_copro_annuelles", type: "INTEGER" },
    { name: "annee_construction", type: "INTEGER" },
    { name: "exposition", type: "VARCHAR(10)" },
    { name: "taxe_fonciere", type: "INTEGER" },
    { name: "nb_lots_copro", type: "INTEGER" },
  ];
  const migrateSql = migratePropertyColumns
    .map(
      (col) =>
        `DO $$ BEGIN ALTER TABLE properties ADD COLUMN ${col.name} ${col.type}; EXCEPTION WHEN duplicate_column THEN NULL; END $$`
    )
    .join("; ");
  await db.query(migrateSql);

  propertiesTableEnsured = true;
}

// ─── CRUD Functions ──────────────────────────────────────────────────

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  await ensurePropertiesTable();
  const db = getPool();

  const result = await db.query(
    `INSERT INTO properties (
      user_id, address_raw, property_type, room_count, surface_m2, floor_number, sale_price
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      input.userId,
      input.addressRaw,
      input.propertyType ?? null,
      input.roomCount ?? null,
      input.surfaceM2 ?? null,
      input.floorNumber ?? null,
      input.salePrice ?? null,
    ]
  );

  return result.rows[0] as Property;
}

/**
 * Find a property by address for a user, or create one if it doesn't exist.
 * Used when creating dossiers in Pro mode to ensure the property appears in "Mes biens".
 */
export async function findOrCreatePropertyByAddress(
  userId: string,
  addressRaw: string,
  extras?: {
    propertyType?: string | null;
    surfaceM2?: number | null;
    salePrice?: number | null;
    roomCount?: number | null;
  }
): Promise<Property> {
  await ensurePropertiesTable();
  const db = getPool();

  // Try to find an existing property with the same address
  const existing = await db.query(
    `SELECT * FROM properties WHERE user_id = $1 AND LOWER(TRIM(address_raw)) = LOWER(TRIM($2)) LIMIT 1`,
    [userId, addressRaw]
  );

  if (existing.rows[0]) {
    return existing.rows[0] as Property;
  }

  // Create a new property
  return createProperty({
    userId,
    addressRaw,
    propertyType: extras?.propertyType ?? null,
    surfaceM2: extras?.surfaceM2 ?? null,
    salePrice: extras?.salePrice ?? null,
    roomCount: extras?.roomCount ?? null,
  });
}

export async function getPropertiesByUser(userId: string): Promise<Property[]> {
  await ensurePropertiesTable();
  const db = getPool();

  const result = await db.query(
    `SELECT p.*,
      (SELECT COUNT(*) FROM user_photos up WHERE up.property_id = p.id) as photo_count,
      (SELECT COUNT(*) FROM dossiers d WHERE LOWER(TRIM(d.bien_adresse)) = LOWER(TRIM(p.address_raw)) AND d.user_id = p.user_id AND (d.status IS NULL OR d.status != 'archived')) as dossier_count,
      (SELECT COALESCE(a.slug, a.uuid) FROM annonces a WHERE a.property_id = p.id::text AND a.user_id = p.user_id AND a.status = 'active' AND a.expires_at > NOW() ORDER BY a.created_at DESC LIMIT 1) as annonce_uuid
    FROM properties p
    WHERE p.user_id = $1
    ORDER BY p.updated_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row,
    photo_count: parseInt(row.photo_count, 10),
    dossier_count: parseInt(row.dossier_count, 10),
    annonce_uuid: row.annonce_uuid || null,
  })) as Property[];
}

export async function getPropertyById(propertyId: string, userId: string): Promise<Property | null> {
  await ensurePropertiesTable();
  const db = getPool();

  const result = await db.query(
    `SELECT p.*,
      (SELECT COUNT(*) FROM user_photos up WHERE up.property_id = p.id) as photo_count,
      (SELECT COUNT(*) FROM dossiers d WHERE LOWER(TRIM(d.bien_adresse)) = LOWER(TRIM(p.address_raw)) AND d.user_id = p.user_id AND (d.status IS NULL OR d.status != 'archived')) as dossier_count,
      (SELECT COALESCE(d.slug, d.uuid::text) FROM dossiers d WHERE LOWER(TRIM(d.bien_adresse)) = LOWER(TRIM(p.address_raw)) AND d.user_id = p.user_id AND (d.status IS NULL OR d.status != 'archived') ORDER BY d.created_at DESC LIMIT 1) as last_dossier_path
    FROM properties p
    WHERE p.id = $1 AND p.user_id = $2`,
    [propertyId, userId]
  );

  if (!result.rows[0]) return null;

  return {
    ...result.rows[0],
    photo_count: parseInt(result.rows[0].photo_count, 10),
    dossier_count: parseInt(result.rows[0].dossier_count, 10),
    last_dossier_path: result.rows[0].last_dossier_path || null,
  } as Property;
}

export async function updateProperty(
  propertyId: string,
  userId: string,
  input: UpdatePropertyInput
): Promise<Property | null> {
  await ensurePropertiesTable();
  const db = getPool();

  const setClauses: string[] = ["updated_at = NOW()"];
  const values: (string | number | boolean | null)[] = [propertyId, userId];
  let paramIdx = 3;

  const fieldMap: Record<string, keyof UpdatePropertyInput> = {
    address_raw: "addressRaw",
    address_normalized: "addressNormalized",
    latitude: "latitude",
    longitude: "longitude",
    commune_code: "communeCode",
    postal_code: "postalCode",
    city: "city",
    property_type: "propertyType",
    room_count: "roomCount",
    surface_m2: "surfaceM2",
    floor_number: "floorNumber",
    dvf_median_price_m2: "dvfMedianPriceM2",
    dvf_period: "dvfPeriod",
    map_image_key: "mapImageKey",
    description_generated: "descriptionGenerated",
    description_final: "descriptionFinal",
    sale_price: "salePrice",
    dpe_classe: "dpeClasse",
    ges_classe: "gesClasse",
    etage: "etage",
    ascenseur: "ascenseur",
    parking: "parking",
    cave: "cave",
    charges_copro_annuelles: "chargesCoproAnnuelles",
    annee_construction: "anneeConstruction",
    exposition: "exposition",
    taxe_fonciere: "taxeFonciere",
    nb_lots_copro: "nbLotsCopro",
  };

  for (const [col, key] of Object.entries(fieldMap)) {
    if (input[key] !== undefined) {
      setClauses.push(`${col} = $${paramIdx}`);
      values.push(input[key] as string | number | null);
      paramIdx++;
    }
  }

  if (setClauses.length === 1) return getPropertyById(propertyId, userId);

  const result = await db.query(
    `UPDATE properties SET ${setClauses.join(", ")}
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    values
  );

  return (result.rows[0] as Property) ?? null;
}

export async function getPropertyByUserAndAddress(userId: string, addressRaw: string): Promise<Property | null> {
  await ensurePropertiesTable();
  const db = getPool();

  const result = await db.query(
    `SELECT * FROM properties WHERE user_id = $1 AND address_raw = $2 ORDER BY updated_at DESC LIMIT 1`,
    [userId, addressRaw]
  );

  return (result.rows[0] as Property) ?? null;
}

export async function deleteProperty(propertyId: string, userId: string): Promise<boolean> {
  await ensurePropertiesTable();
  const db = getPool();

  // Dissociate photos first (SET NULL behavior)
  await db.query(
    `UPDATE user_photos SET property_id = NULL WHERE property_id = $1`,
    [propertyId]
  );

  const result = await db.query(
    `DELETE FROM properties WHERE id = $1 AND user_id = $2`,
    [propertyId, userId]
  );

  return (result.rowCount ?? 0) > 0;
}
