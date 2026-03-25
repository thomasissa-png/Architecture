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
