import { getPool, ensureTable } from "@/lib/db";

export async function ensureUser(user: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<void> {
  await ensureTable();
  const db = getPool();
  await db.query(
    `INSERT INTO users (id, email, name, image)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = COALESCE(EXCLUDED.name, users.name),
       image = COALESCE(EXCLUDED.image, users.image)`,
    [user.id, user.email, user.name ?? null, user.image ?? null]
  );
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
 * F4: Check if user has purchased a Pro-level pack (50+ credits purchased).
 * For Mode Marchand access, we check purchase history rather than current balance
 * because balance decreases with usage.
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  await ensureTable();
  const db = getPool();
  // Check if user has ever purchased a pro-level pack (50+ credits)
  const result = await db.query(
    `SELECT COUNT(*) as count FROM purchases
     WHERE user_id = $1 AND credits_purchased >= 50 AND status = 'completed'`,
    [userId]
  );
  return Number(result.rows[0]?.count ?? 0) > 0;
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
