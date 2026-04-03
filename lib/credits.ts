import { getPool, ensureTable } from "@/lib/db";

export async function ensureUser(user: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<void> {
  await ensureTable();
  const db = getPool();
  const email = user.email.toLowerCase().trim();

  // Check if user already exists with a DIFFERENT id (provider switch: credentials→Google or vice versa)
  const existing = await db.query(
    `SELECT id, role, credits_remaining FROM users WHERE email = $1`,
    [email]
  );

  if (existing.rows.length > 0 && existing.rows[0].id !== user.id) {
    const oldId = existing.rows[0].id;
    const oldRole = existing.rows[0].role;
    const oldCredits = existing.rows[0].credits_remaining || 0;
    console.warn(`[ensureUser] ID MISMATCH for email="${email}": old="${oldId}" new="${user.id}" — migrating everything`);

    // Transaction: migrate all data from old id to new id, then delete old user
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 1. Create new user (or update if exists)
      await client.query(
        `INSERT INTO users (id, email, name, image, role, credits_remaining)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = COALESCE(EXCLUDED.name, users.name),
           image = COALESCE(EXCLUDED.image, users.image),
           role = CASE WHEN EXCLUDED.role IN ('pro','admin') THEN EXCLUDED.role ELSE users.role END,
           credits_remaining = users.credits_remaining + EXCLUDED.credits_remaining`,
        [user.id, email, user.name ?? null, user.image ?? null, oldRole || "user", oldCredits]
      );

      // 2. Migrate user_photos ownership
      await client.query(
        `UPDATE user_photos SET user_id = $1 WHERE user_id = $2`,
        [user.id, oldId]
      );
      // 3. Migrate properties ownership
      await client.query(
        `UPDATE properties SET user_id = $1 WHERE user_id = $2`,
        [user.id, oldId]
      );
      // 4. Migrate dossiers ownership
      await client.query(
        `UPDATE dossiers SET user_id = $1 WHERE user_id = $2`,
        [user.id, oldId]
      );
      // 5. Migrate purchases
      await client.query(
        `UPDATE purchases SET user_id = $1 WHERE user_id = $2`,
        [user.id, oldId]
      );
      // 6. Migrate merchant_profiles
      await client.query(
        `UPDATE merchant_profiles SET user_id = $1 WHERE user_id = $2`,
        [user.id, oldId]
      );

      // 7. Delete old user row (all references migrated)
      await client.query(`DELETE FROM users WHERE id = $1`, [oldId]);

      await client.query("COMMIT");
      console.log(`[ensureUser] Migrated all data from "${oldId}" to "${user.id}" (role=${oldRole}, credits=${oldCredits}, photos+properties+dossiers+purchases+merchant)`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[ensureUser] Migration failed, rolling back:", err instanceof Error ? err.message : err);
      // Fallback: just upsert without migration
      await db.query(
        `INSERT INTO users (id, email, name, image)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = COALESCE(EXCLUDED.name, users.name),
           image = COALESCE(EXCLUDED.image, users.image)`,
        [user.id, email, user.name ?? null, user.image ?? null]
      );
    } finally {
      client.release();
    }
  } else {
    // Normal case: same id or new user — simple upsert
    await db.query(
      `INSERT INTO users (id, email, name, image)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = COALESCE(EXCLUDED.name, users.name),
         image = COALESCE(EXCLUDED.image, users.image)`,
      [user.id, email, user.name ?? null, user.image ?? null]
    );
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  await ensureTable();
  const db = getPool();
  const result = await db.query(
    `SELECT credits_remaining FROM users WHERE id = $1`,
    [userId]
  );
  if (result.rows.length === 0) return 0;
  return result.rows[0].credits_remaining ?? 0;
}

export async function decrementCredit(userId: string): Promise<boolean> {
  await ensureTable();
  const db = getPool();
  const result = await db.query(
    `UPDATE users SET credits_remaining = credits_remaining - 1
     WHERE id = $1 AND credits_remaining > 0
     RETURNING credits_remaining`,
    [userId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * F4: Check if user has Pro access for Mode Pro (ex Mode Marchand).
 * Two paths:
 * 1. User has purchased a Pro-level pack (50+ credits purchased via Stripe)
 * 2. User has role 'pro' or 'admin' in users table (set via admin API)
 * This allows the founder to grant Pro access manually before Stripe is live.
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  await ensureTable();
  const db = getPool();

  // Path 1: Check user role (pro or admin)
  const roleResult = await db.query(
    `SELECT role, email FROM users WHERE id = $1`,
    [userId]
  );
  const role = roleResult.rows[0]?.role;
  const email = roleResult.rows[0]?.email;
  console.log(`[hasProAccess] userId="${userId}" email="${email}" role="${role}" rowCount=${roleResult.rows.length}`);
  if (role === "pro" || role === "admin") return true;

  // Path 1b: Check by email (resilience if user_id changed between sessions)
  if (!roleResult.rows[0] && userId) {
    // User not found by id — might have been recreated with a different id
    // This can happen if NEXTAUTH_SECRET changed and credentials generated a new user row
    console.warn(`[hasProAccess] userId="${userId}" NOT FOUND in users table`);
  }

  // Path 2: Check purchase history (50+ credits purchased)
  const purchaseResult = await db.query(
    `SELECT COUNT(*) as count FROM purchases
     WHERE user_id = $1 AND credits_purchased >= 50 AND status = 'completed'`,
    [userId]
  );
  return Number(purchaseResult.rows[0]?.count ?? 0) > 0;
}

/**
 * Check if user has gallery access (/ma-galerie).
 * Two paths:
 * 1. User has Pro access (role 'pro'/'admin' or purchased 50+ credits)
 * 2. User has purchased at least 15 credits total (Starter pack threshold)
 */
export async function hasGalleryAccess(userId: string): Promise<boolean> {
  // Path 1: Pro or admin — reuse existing logic
  const pro = await hasProAccess(userId);
  if (pro) return true;

  // Path 2: Total credits purchased >= 15 (Starter threshold)
  await ensureTable();
  const db = getPool();
  const result = await db.query(
    `SELECT COALESCE(SUM(credits_purchased), 0) AS total
     FROM purchases
     WHERE user_id = $1 AND status = 'completed'`,
    [userId]
  );
  return Number(result.rows[0]?.total ?? 0) >= 15;
}

/**
 * Get maximum iterations allowed for a user based on their plan.
 * - Anonymous (no userId) = 0
 * - Découverte (no purchase) = 0
 * - Starter (purchased >= 15 credits but not Pro) = 1
 * - Pro (hasProAccess) = 3
 * - Admin = 3
 */

/**
 * Check if user has Starter access (has purchased at least 1 pack).
 * Distinguishes free users (2 credits gratuits) from paying Starter users.
 */
export async function hasStarterAccess(userId: string): Promise<boolean> {
  await ensureTable();
  const db = getPool();
  const result = await db.query(
    `SELECT COUNT(*) as count FROM purchases
     WHERE user_id = $1 AND status = 'completed'`,
    [userId]
  );
  return Number(result.rows[0]?.count ?? 0) > 0;
}

export async function getMaxIterations(userId: string | null): Promise<number> {
  if (!userId) return 0;

  // Pro or admin = 3 iterations
  const pro = await hasProAccess(userId);
  if (pro) return 3;

  // Starter (has purchased at least 1 pack) = 1 iteration
  const starter = await hasStarterAccess(userId);
  if (starter) return 1;

  // Découverte (free credits only, no purchase) = 0 iterations
  return 0;
}

export async function addCredits(
  userId: string,
  amount: number
): Promise<void> {
  await ensureTable();
  const db = getPool();
  await db.query(
    `UPDATE users SET credits_remaining = credits_remaining + $2
     WHERE id = $1`,
    [userId, amount]
  );
}
