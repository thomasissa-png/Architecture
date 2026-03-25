import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureTable, getImage } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/demo?style=scandinavian — Returns the best successful generation for a style
 * GET /api/demo?type=hero — Returns the best overall generation (for hero before/after)
 * GET /api/demo?list=1 — Returns available demo styles (no images, just metadata)
 *
 * Images are served from Object Storage via the generation_logs table.
 * No auth required — demo content is public.
 */
export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  const style = req.nextUrl.searchParams.get("style");
  const type = req.nextUrl.searchParams.get("type");
  const imageType = req.nextUrl.searchParams.get("image"); // "before" | "after"
  const list = req.nextUrl.searchParams.get("list");

  try {
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
    if (style) {
      const result = await pool.query(`
        SELECT input_image_path, output_image_path, style_id, duration_ms
        FROM generation_logs
        WHERE success = true AND output_image_path IS NOT NULL AND style_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [style]);
      row = result.rows[0];
    } else if (type === "hero") {
      const result = await pool.query(`
        SELECT input_image_path, output_image_path, style_id, duration_ms
        FROM generation_logs
        WHERE success = true AND output_image_path IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `);
      row = result.rows[0];
    } else {
      return NextResponse.json({ error: "Specify ?style=xxx or ?type=hero or ?list=1" }, { status: 400 });
    }

    if (!row) {
      return NextResponse.json({ error: "No demo available for this style" }, { status: 404 });
    }

    // If image param specified, serve the actual image
    if (imageType === "before" || imageType === "after") {
      const path = imageType === "before" ? row.input_image_path : row.output_image_path;
      if (!path) {
        return NextResponse.json({ error: "Image path not found" }, { status: 404 });
      }

      const basename = path.split("/").pop() || path;
      const key = `logs/${basename}`;
      const buffer = await getImage(key);

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

    // Return metadata only
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
