import { getPool, ensureTable } from "@/lib/db";

export async function ensureUser(user: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<void> {
  await ensureTable();
  const db = getPool();

  // Check if user already exists to detect id changes
  const existing = await db.query(
    `SELECT id, role FROM users WHERE email = $1`,
    [user.email.toLowerCase().trim()]
  );
  if (existing.rows.length > 0 && existing.rows[0].id !== user.id) {
    // DANGER: same email, different id — migrate role + credits to new id
    console.warn(`[ensureUser] ID MISMATCH for email="${user.email}": old="${existing.rows[0].id}" new="${user.id}" — migrating role="${existing.rows[0].role}"`);
  }

  await db.query(
    `INSERT INTO users (id, email, name, image)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = COALESCE(EXCLUDED.name, users.name),
       image = COALESCE(EXCLUDED.image, users.image)`,
    [user.id, user.email.toLowerCase().trim(), user.name ?? null, user.image ?? null]
  );

  // If there was an id mismatch, migrate role and credits from old account
  if (existing.rows.length > 0 && existing.rows[0].id !== user.id) {
    const oldId = existing.rows[0].id;
    const oldRole = existing.rows[0].role;
    // Copy role from old account if it was pro/admin
    if (oldRole === "pro" || oldRole === "admin") {
      await db.query(`UPDATE users SET role = $1 WHERE id = $2`, [oldRole, user.id]);
      console.log(`[ensureUser] Migrated role="${oldRole}" from old="${oldId}" to new="${user.id}"`);
    }
    // Copy credits from old account
    await db.query(
      `UPDATE users SET credits_remaining = credits_remaining + COALESCE(
        (SELECT credits_remaining FROM users WHERE id = $1), 0
      ) WHERE id = $2`,
      [oldId, user.id]
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
 * F4: Check if user has Pro access for Mode Marchand.
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
