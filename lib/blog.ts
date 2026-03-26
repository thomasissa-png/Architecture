import { getPool, ensureTable } from "./db";

// ─── Blog table auto-creation ────────────────────────────────────────────────

let blogTableEnsured = false;

export async function ensureBlogTable(): Promise<void> {
  if (blogTableEnsured) return;
  await ensureTable(); // ensure base tables exist first
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id              SERIAL PRIMARY KEY,
      slug            VARCHAR(200) UNIQUE NOT NULL,
      title           TEXT NOT NULL,
      content         TEXT NOT NULL DEFAULT '',
      meta_description TEXT,
      keyword         VARCHAR(200),
      persona         VARCHAR(50),
      style_id        VARCHAR(50),
      published       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts (slug);
    CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts (published);
  `);
  blogTableEnsured = true;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  keyword: string | null;
  persona: string | null;
  style_id: string | null;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBlogPostInput {
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  keyword?: string;
  persona?: string;
  style_id?: string;
  published?: boolean;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getBlogPosts(options?: {
  publishedOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<BlogPost[]> {
  await ensureBlogTable();
  const db = getPool();
  const publishedOnly = options?.publishedOnly ?? true;
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const where = publishedOnly ? "WHERE published = TRUE" : "";
  const result = await db.query(
    `SELECT * FROM blog_posts ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  await ensureBlogTable();
  const db = getPool();
  const result = await db.query(
    "SELECT * FROM blog_posts WHERE slug = $1 LIMIT 1",
    [slug]
  );
  return (result.rows[0] as BlogPost) ?? null;
}

export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  await ensureBlogTable();
  const db = getPool();
  const result = await db.query(
    `INSERT INTO blog_posts (slug, title, content, meta_description, keyword, persona, style_id, published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.slug,
      input.title,
      input.content,
      input.meta_description ?? null,
      input.keyword ?? null,
      input.persona ?? null,
      input.style_id ?? null,
      input.published ?? false,
    ]
  );
  return result.rows[0] as BlogPost;
}

export async function updateBlogPost(
  slug: string,
  updates: Partial<Omit<CreateBlogPostInput, "slug">>
): Promise<BlogPost | null> {
  await ensureBlogTable();
  const db = getPool();

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.title !== undefined) { fields.push(`title = $${idx++}`); values.push(updates.title); }
  if (updates.content !== undefined) { fields.push(`content = $${idx++}`); values.push(updates.content); }
  if (updates.meta_description !== undefined) { fields.push(`meta_description = $${idx++}`); values.push(updates.meta_description); }
  if (updates.keyword !== undefined) { fields.push(`keyword = $${idx++}`); values.push(updates.keyword); }
  if (updates.persona !== undefined) { fields.push(`persona = $${idx++}`); values.push(updates.persona); }
  if (updates.style_id !== undefined) { fields.push(`style_id = $${idx++}`); values.push(updates.style_id); }
  if (updates.published !== undefined) { fields.push(`published = $${idx++}`); values.push(updates.published); }

  if (fields.length === 0) return getBlogPostBySlug(slug);

  fields.push(`updated_at = NOW()`);
  values.push(slug);

  const result = await db.query(
    `UPDATE blog_posts SET ${fields.join(", ")} WHERE slug = $${idx} RETURNING *`,
    values
  );
  return (result.rows[0] as BlogPost) ?? null;
}
