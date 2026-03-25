/**
 * Properties (Biens) — Entite persistante pour le Mode Marchand.
 *
 * Un bien = une adresse + enrichissement API (geocoding, DVF, carte, description).
 * Plusieurs photos (user_photos) peuvent etre associees a un bien.
 * Plusieurs dossiers peuvent etre generes depuis les photos d'un bien.
 */

import { getPool, ensureTable } from "@/lib/db";

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
  photo_count?: number;
  dossier_count?: number;
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
}

// ─── DB Schema Migration ────────────────────────────────────────────

let propertiesTableEnsured = false;

export async function ensurePropertiesTable(): Promise<void> {
  if (propertiesTableEnsured) return;
  await ensureTable();

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

export async function getPropertiesByUser(userId: string): Promise<Property[]> {
  await ensurePropertiesTable();
  const db = getPool();

  const result = await db.query(
    `SELECT p.*,
      (SELECT COUNT(*) FROM user_photos up WHERE up.property_id = p.id) as photo_count,
      (SELECT COUNT(*) FROM dossiers d WHERE d.bien_adresse = p.address_raw AND d.user_id = p.user_id) as dossier_count
    FROM properties p
    WHERE p.user_id = $1
    ORDER BY p.updated_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row,
    photo_count: parseInt(row.photo_count, 10),
    dossier_count: parseInt(row.dossier_count, 10),
  })) as Property[];
}

export async function getPropertyById(propertyId: string, userId: string): Promise<Property | null> {
  await ensurePropertiesTable();
  const db = getPool();

  const result = await db.query(
    `SELECT p.*,
      (SELECT COUNT(*) FROM user_photos up WHERE up.property_id = p.id) as photo_count,
      (SELECT COUNT(*) FROM dossiers d WHERE d.bien_adresse = p.address_raw AND d.user_id = p.user_id) as dossier_count
    FROM properties p
    WHERE p.id = $1 AND p.user_id = $2`,
    [propertyId, userId]
  );

  if (!result.rows[0]) return null;

  return {
    ...result.rows[0],
    photo_count: parseInt(result.rows[0].photo_count, 10),
    dossier_count: parseInt(result.rows[0].dossier_count, 10),
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
  const values: (string | number | null)[] = [propertyId, userId];
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
