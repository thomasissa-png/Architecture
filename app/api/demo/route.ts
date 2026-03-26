import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTable, getImage } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/demo?style=scandinavian — Returns the best successful generation for a style
 * GET /api/demo?type=hero — Returns the best overall generation (for hero before/after)
 * GET /api/demo?list=1 — Returns available demo styles (no images, just metadata)
 *
 * Hero images (fixed=true) are cached in memory after first load.
 * No auth required — demo content is public.
 */

// ─── In-memory cache for hero images (survives requests, cleared on redeploy) ───
const heroCache: { before: Uint8Array | null; after: Uint8Array | null; loaded: boolean } = {
  before: null,
  after: null,
  loaded: false,
};

async function loadHeroImages(): Promise<void> {
  if (heroCache.loaded) return;

  try {
    await ensureTable();
    const pool = getPool();

    // Try fixed timestamp first
    let result = await pool.query(`
      SELECT input_image_path, output_image_path
      FROM generation_logs
      WHERE success = true AND output_image_path IS NOT NULL
        AND style_id = 'scandinavian'
        AND created_at >= '2026-03-25T10:59:00'
        AND created_at <= '2026-03-25T11:02:00'
      ORDER BY created_at DESC LIMIT 1
    `);
    let row = result.rows[0];

    // Fallback: latest scandinavian
    if (!row) {
      result = await pool.query(`
        SELECT input_image_path, output_image_path
        FROM generation_logs
        WHERE success = true AND output_image_path IS NOT NULL AND style_id = 'scandinavian'
        ORDER BY created_at DESC LIMIT 1
      `);
      row = result.rows[0];
    }

    if (!row) {
      heroCache.loaded = true;
      return;
    }

    // Load both images into memory
    for (const type of ["before", "after"] as const) {
      const path = type === "before" ? row.input_image_path : row.output_image_path;
      if (!path) continue;
      const basename = (path.split("/").pop() || "").replace(/[^a-zA-Z0-9._-]/g, "");
      if (!basename) continue;
      const buffer = await getImage(`logs/${basename}`);
      if (buffer) {
        heroCache[type] = new Uint8Array(buffer);
      }
    }

    heroCache.loaded = true;
    console.log(`[demo] Hero images cached: before=${heroCache.before ? heroCache.before.length : 0}B, after=${heroCache.after ? heroCache.after.length : 0}B`);
  } catch (err) {
    console.error("[demo] Failed to load hero images:", err instanceof Error ? err.message : err);
    // Don't set loaded=true so it retries next request
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  const style = req.nextUrl.searchParams.get("style");
  const type = req.nextUrl.searchParams.get("type");
  const imageType = req.nextUrl.searchParams.get("image"); // "before" | "after"
  const list = req.nextUrl.searchParams.get("list");
  const fixed = req.nextUrl.searchParams.get("fixed"); // "true" to pin hero to a specific generation

  try {
    // ─── Fast path: serve hero images from memory cache ───
    if (fixed === "true" && (imageType === "before" || imageType === "after")) {
      await loadHeroImages();
      const cached = heroCache[imageType];
      if (cached) {
        return new NextResponse(Buffer.from(cached), {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
          },
        });
      }
      // Cache miss — fall through to DB query below
    }

    await ensureTable();
    const pool = getPool();

    // List available demo styles
    if (list) {
      const result = await pool.query(`
        SELECT DISTINCT style_id, COUNT(*) as count
        FROM generation_logs
        WHERE success = true AND output_image_path IS NOT NULL AND style_id IS NOT NULL
        GROUP BY style_id
        ORDER BY style_id
      `);
      return NextResponse.json({ styles: result.rows });
    }

    // Get best generation for a specific style or hero
    let row;

    if (fixed === "true" && (type === "hero" || style)) {
      const fixedResult = await pool.query(`
        SELECT input_image_path, output_image_path, style_id, duration_ms
        FROM generation_logs
        WHERE success = true AND output_image_path IS NOT NULL
          AND style_id = 'scandinavian'
          AND created_at >= '2026-03-25T10:59:00'
          AND created_at <= '2026-03-25T11:02:00'
        ORDER BY created_at DESC LIMIT 1
      `);
      row = fixedResult.rows[0];
      if (!row) {
        const fallbackResult = await pool.query(`
          SELECT input_image_path, output_image_path, style_id, duration_ms
          FROM generation_logs
          WHERE success = true AND output_image_path IS NOT NULL AND style_id = 'scandinavian'
          ORDER BY created_at DESC LIMIT 1
        `);
        row = fallbackResult.rows[0];
      }
    } else if (style) {
      const result = await pool.query(`
        SELECT input_image_path, output_image_path, style_id, duration_ms
        FROM generation_logs
        WHERE success = true AND output_image_path IS NOT NULL AND style_id = $1
        ORDER BY created_at DESC LIMIT 1
      `, [style]);
      row = result.rows[0];
    } else if (type === "hero") {
      const result = await pool.query(`
        SELECT input_image_path, output_image_path, style_id, duration_ms
        FROM generation_logs
        WHERE success = true AND output_image_path IS NOT NULL
        ORDER BY created_at DESC LIMIT 1
      `);
      row = result.rows[0];
    } else {
      return NextResponse.json({ error: "Specify ?style=xxx or ?type=hero or ?list=1" }, { status: 400 });
    }

    if (!row) {
      return NextResponse.json({ error: "No demo available for this style" }, { status: 404 });
    }

    // Serve image
    if (imageType === "before" || imageType === "after") {
      const path = imageType === "before" ? row.input_image_path : row.output_image_path;
      if (!path) {
        return NextResponse.json({ error: "Image path not found" }, { status: 404 });
      }

      const basename = (path.split("/").pop() || "").replace(/[^a-zA-Z0-9._-]/g, "");
      if (!basename) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      const buffer = await getImage(`logs/${basename}`);

      if (!buffer) {
        return NextResponse.json({ error: "Image not found in storage" }, { status: 404 });
      }

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    return NextResponse.json({
      style_id: row.style_id,
      duration_ms: row.duration_ms,
      before: `/api/demo?style=${row.style_id}&image=before`,
      after: `/api/demo?style=${row.style_id}&image=after`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("GET /api/demo failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
