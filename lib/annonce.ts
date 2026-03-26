/**
 * F6 — Annonce immobiliere publique.
 *
 * Types + CRUD DB functions for annonces.
 * An annonce is a public page generated from a property's data + photos.
 * Pro+ access required. No generation cost (display only).
 */

import { getPool, ensureTable } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────

export type AnnonceStatus = "active" | "archived";

export interface Annonce {
  id: number;
  uuid: string;
  user_id: string;
  property_id: string;
  title: string | null;
  status: AnnonceStatus;
  created_at: string;
  expires_at: string;
}

// ─── DB Schema Migration ────────────────────────────────────────────

let annonceTableEnsured = false;

export async function ensureAnnonceTable(): Promise<void> {
  if (annonceTableEnsured) return;
  await ensureTable();

  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS annonces (
      id SERIAL PRIMARY KEY,
      uuid TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      title TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
    );
    CREATE INDEX IF NOT EXISTS idx_annonces_uuid ON annonces (uuid);
    CREATE INDEX IF NOT EXISTS idx_annonces_user ON annonces (user_id);
    CREATE INDEX IF NOT EXISTS idx_annonces_property ON annonces (property_id);
  `);

  annonceTableEnsured = true;
}

// ─── UUID generation ─────────────────────────────────────────────────

function generateUUID(): string {
  return crypto.randomUUID();
}

// ─── CRUD Functions ──────────────────────────────────────────────────

export async function createAnnonce(params: {
  userId: string;
  propertyId: string;
  title?: string | null;
}): Promise<Annonce> {
  await ensureAnnonceTable();
  const db = getPool();
  const uuid = generateUUID();

  const result = await db.query(
    `INSERT INTO annonces (uuid, user_id, property_id, title)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [uuid, params.userId, params.propertyId, params.title ?? null]
  );

  return result.rows[0] as Annonce;
}

export async function getAnnonceByUuid(uuid: string): Promise<Annonce | null> {
  await ensureAnnonceTable();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM annonces WHERE uuid = $1`,
    [uuid]
  );
  return (result.rows[0] as Annonce) ?? null;
}

export async function getAnnoncesByUserId(userId: string): Promise<Annonce[]> {
  await ensureAnnonceTable();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM annonces WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows as Annonce[];
}

export async function archiveAnnonce(uuid: string, userId: string): Promise<boolean> {
  await ensureAnnonceTable();
  const db = getPool();
  const result = await db.query(
    `UPDATE annonces SET status = 'archived' WHERE uuid = $1 AND user_id = $2`,
    [uuid, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getActiveAnnonceForProperty(
  userId: string,
  propertyId: string
): Promise<Annonce | null> {
  await ensureAnnonceTable();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM annonces
     WHERE user_id = $1 AND property_id = $2 AND status = 'active' AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, propertyId]
  );
  return (result.rows[0] as Annonce) ?? null;
}

export async function updateAnnonceTitle(
  uuid: string,
  userId: string,
  title: string
): Promise<boolean> {
  await ensureAnnonceTable();
  const db = getPool();
  const result = await db.query(
    `UPDATE annonces SET title = $1 WHERE uuid = $2 AND user_id = $3`,
    [title, uuid, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function isAnnonceExpired(annonce: Annonce): boolean {
  return new Date(annonce.expires_at) < new Date();
}

export function isAnnonceActive(annonce: Annonce): boolean {
  return annonce.status === "active" && !isAnnonceExpired(annonce);
}
