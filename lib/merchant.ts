/**
 * F4.A — Profil Marchand: Types + CRUD DB functions.
 *
 * Stores merchant branding (logo, colors, font) for PDF generation
 * and public dossier pages. One profile per user.
 */

import { getPool, ensureTable, saveImage, getImage } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────

export interface MerchantProfile {
  id: number;
  user_id: string;
  is_merchant: boolean;
  siret: string | null;
  raison_sociale: string | null;
  adresse: string | null;
  telephone: string | null;
  email_pro: string | null;
  forme_juridique: string | null;
  logo_storage_key: string | null;
  couleur_principale: string;
  couleur_secondaire: string;
  police: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertMerchantProfileInput {
  userId: string;
  isMerchant: boolean;
  siret?: string | null;
  raisonSociale?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  emailPro?: string | null;
  formeJuridique?: string | null;
  couleurPrincipale?: string;
  couleurSecondaire?: string;
  police?: string;
}

export interface SiretLookupResult {
  raisonSociale: string;
  adresse: string;
  formeJuridique: string;
  dirigeant: string | null;
  codeNaf: string | null;
}

// ─── DB Schema Migration ────────────────────────────────────────────

let merchantTableEnsured = false;

export async function ensureMerchantTable(): Promise<void> {
  if (merchantTableEnsured) return;
  await ensureTable();

  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS merchant_profiles (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) UNIQUE NOT NULL,
      is_merchant BOOLEAN DEFAULT false,
      siret VARCHAR(14),
      raison_sociale VARCHAR(255),
      adresse TEXT,
      telephone VARCHAR(20),
      email_pro VARCHAR(255),
      forme_juridique VARCHAR(100),
      logo_storage_key VARCHAR(255),
      couleur_principale VARCHAR(7) DEFAULT '#1C1C1E',
      couleur_secondaire VARCHAR(7) DEFAULT '#7D9B76',
      police VARCHAR(50) DEFAULT 'Inter',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_merchant_user ON merchant_profiles (user_id);
  `);

  merchantTableEnsured = true;
}

// ─── CRUD Functions ──────────────────────────────────────────────────

export async function getMerchantProfile(userId: string): Promise<MerchantProfile | null> {
  await ensureMerchantTable();
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM merchant_profiles WHERE user_id = $1`,
    [userId]
  );
  return (result.rows[0] as MerchantProfile) ?? null;
}

export async function upsertMerchantProfile(input: UpsertMerchantProfileInput): Promise<MerchantProfile> {
  await ensureMerchantTable();
  const db = getPool();

  const result = await db.query(
    `INSERT INTO merchant_profiles (
      user_id, is_merchant, siret, raison_sociale, adresse,
      telephone, email_pro, forme_juridique,
      couleur_principale, couleur_secondaire, police
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (user_id) DO UPDATE SET
      is_merchant = EXCLUDED.is_merchant,
      siret = EXCLUDED.siret,
      raison_sociale = EXCLUDED.raison_sociale,
      adresse = EXCLUDED.adresse,
      telephone = EXCLUDED.telephone,
      email_pro = EXCLUDED.email_pro,
      forme_juridique = EXCLUDED.forme_juridique,
      couleur_principale = EXCLUDED.couleur_principale,
      couleur_secondaire = EXCLUDED.couleur_secondaire,
      police = EXCLUDED.police,
      updated_at = NOW()
    RETURNING *`,
    [
      input.userId,
      input.isMerchant,
      input.siret ?? null,
      input.raisonSociale ?? null,
      input.adresse ?? null,
      input.telephone ?? null,
      input.emailPro ?? null,
      input.formeJuridique ?? null,
      input.couleurPrincipale ?? "#1C1C1E",
      input.couleurSecondaire ?? "#7D9B76",
      input.police ?? "Inter",
    ]
  );

  return result.rows[0] as MerchantProfile;
}

export async function uploadMerchantLogo(
  userId: string,
  logoBase64: string
): Promise<string> {
  await ensureMerchantTable();

  const storageKey = await saveImage(logoBase64, `merchant_logo_${userId}_${Date.now()}`);

  const db = getPool();
  await db.query(
    `UPDATE merchant_profiles SET logo_storage_key = $2, updated_at = NOW() WHERE user_id = $1`,
    [userId, storageKey]
  );

  return storageKey;
}

export async function getMerchantLogo(storageKey: string): Promise<Uint8Array | null> {
  return getImage(storageKey);
}
