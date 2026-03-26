/**
 * User Photos — Galerie persistante des generations.
 *
 * Chaque generation reussie est sauvegardee automatiquement dans user_photos.
 * Les photos peuvent etre associees a un bien (property_id) ou rester "non classees".
 */

import { getPool, ensureTable } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────

export interface UserPhoto {
  id: string;
  user_id: string;
  property_id: string | null;
  input_image_key: string | null;
  output_image_key: string | null;
  pass1_image_key: string | null;
  style_id: string | null;
  room_type: string | null;
  room_label: string | null;
  is_outdoor: boolean;
  created_at: string;
}

// ─── DB Schema Migration ────────────────────────────────────────────

let userPhotosTableEnsured = false;

export async function ensureUserPhotosTable(): Promise<void> {
  if (userPhotosTableEnsured) return;
  await ensureTable();

  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      property_id UUID,
      input_image_key VARCHAR(255),
      output_image_key VARCHAR(255),
      pass1_image_key VARCHAR(255),
      style_id VARCHAR(50),
      room_type VARCHAR(50),
      room_label VARCHAR(100),
      is_outdoor BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_user_photos_user ON user_photos (user_id);
    CREATE INDEX IF NOT EXISTS idx_user_photos_property ON user_photos (property_id);
  `);

  userPhotosTableEnsured = true;
}

// ─── CRUD Functions ──────────────────────────────────────────────────

export async function saveUserPhoto(params: {
  userId: string;
  inputImageKey?: string | null;
  outputImageKey?: string | null;
  pass1ImageKey?: string | null;
  styleId?: string | null;
  roomType?: string | null;
  roomLabel?: string | null;
  isOutdoor?: boolean;
  propertyId?: string | null;
}): Promise<string> {
  // Diagnostic log: track what keys are being saved
  console.log(`[saveUserPhoto] userId=${params.userId}, styleId=${params.styleId}, outputImageKey=${params.outputImageKey ?? "NULL"}, inputImageKey=${params.inputImageKey ?? "NULL"}`);

  await ensureUserPhotosTable();
  const db = getPool();

  const result = await db.query(
    `INSERT INTO user_photos (
      user_id, property_id, input_image_key, output_image_key,
      pass1_image_key, style_id, room_type, room_label, is_outdoor
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id`,
    [
      params.userId,
      params.propertyId ?? null,
      params.inputImageKey ?? null,
      params.outputImageKey ?? null,
      params.pass1ImageKey ?? null,
      params.styleId ?? null,
      params.roomType ?? null,
      params.roomLabel ?? null,
      params.isOutdoor ?? false,
    ]
  );

  return result.rows[0].id;
}

export async function getUserPhotos(
  userId: string,
  filters?: {
    propertyId?: string | null;
    styleId?: string | null;
    roomType?: string | null;
    associatedOnly?: boolean;
    unassociatedOnly?: boolean;
  }
): Promise<UserPhoto[]> {
  await ensureUserPhotosTable();
  const db = getPool();

  const conditions = ["user_id = $1"];
  const values: (string | boolean | null)[] = [userId];
  let paramIdx = 2;

  if (filters?.propertyId) {
    conditions.push(`property_id = $${paramIdx}`);
    values.push(filters.propertyId);
    paramIdx++;
  }
  if (filters?.styleId) {
    conditions.push(`style_id = $${paramIdx}`);
    values.push(filters.styleId);
    paramIdx++;
  }
  if (filters?.roomType) {
    conditions.push(`room_type = $${paramIdx}`);
    values.push(filters.roomType);
    paramIdx++;
  }
  if (filters?.associatedOnly) {
    conditions.push("property_id IS NOT NULL");
  }
  if (filters?.unassociatedOnly) {
    conditions.push("property_id IS NULL");
    conditions.push("output_image_key IS NOT NULL");
  }

  const result = await db.query(
    `SELECT * FROM user_photos WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
    values
  );

  const photos = result.rows as UserPhoto[];
  const nullOutputCount = photos.filter((p) => !p.output_image_key).length;
  const emptyStringCount = photos.filter((p) => p.output_image_key === "").length;
  console.log(`[getUserPhotos] userId=${userId}: ${photos.length} photos returned, ${nullOutputCount} with NULL output_image_key, ${emptyStringCount} with empty string output_image_key`);
  if (nullOutputCount > 0) {
    const nullPhotos = photos.filter((p) => !p.output_image_key);
    console.warn(`[getUserPhotos] Photos with NULL output_image_key:`, nullPhotos.map((p) => ({ id: p.id, styleId: p.style_id, createdAt: p.created_at })));
  }

  return photos;
}

export async function getUserPhotoById(photoId: string, userId: string): Promise<UserPhoto | null> {
  await ensureUserPhotosTable();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM user_photos WHERE id = $1 AND user_id = $2`,
    [photoId, userId]
  );
  return (result.rows[0] as UserPhoto) ?? null;
}

export async function associatePhotosToProperty(
  photoIds: string[],
  propertyId: string,
  userId: string
): Promise<number> {
  if (photoIds.length === 0) return 0;
  await ensureUserPhotosTable();
  const db = getPool();

  // Build placeholders: $3, $4, $5...
  const placeholders = photoIds.map((_, i) => `$${i + 3}`).join(", ");
  const result = await db.query(
    `UPDATE user_photos SET property_id = $1
     WHERE user_id = $2 AND id IN (${placeholders})
     AND (property_id IS NULL OR property_id = $1)`,
    [propertyId, userId, ...photoIds]
  );

  return result.rowCount ?? 0;
}

export async function dissociatePhotosFromProperty(
  photoIds: string[],
  propertyId: string,
  userId: string
): Promise<number> {
  if (photoIds.length === 0) return 0;
  await ensureUserPhotosTable();
  const db = getPool();

  const placeholders = photoIds.map((_, i) => `$${i + 3}`).join(", ");
  const result = await db.query(
    `UPDATE user_photos SET property_id = NULL
     WHERE user_id = $2 AND property_id = $1 AND id IN (${placeholders})`,
    [propertyId, userId, ...photoIds]
  );

  return result.rowCount ?? 0;
}

export async function getPhotoCountByProperty(propertyId: string): Promise<number> {
  await ensureUserPhotosTable();
  const db = getPool();
  const result = await db.query(
    `SELECT COUNT(*) as count FROM user_photos WHERE property_id = $1`,
    [propertyId]
  );
  return parseInt(result.rows[0].count, 10);
}
