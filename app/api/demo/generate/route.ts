import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/demo/generate — Trigger demo generation for a specific style
 * Protected by ADMIN_PASSWORD.
 *
 * Body: { imageUrl: string, styleId: string }
 *
 * This endpoint is designed to be called from the admin page or a script.
 * It calls /api/generate internally with the specified style to populate
 * the demo images served by /api/demo.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.ADMIN_PASSWORD || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageBase64, styleId } = await req.json();

    if (!imageBase64 || !styleId) {
      return NextResponse.json(
        { error: "imageBase64 and styleId are required" },
        { status: 400 }
      );
    }

    // Forward to the main generate API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: [imageBase64],
        styleId,
        surfacePrompt: null, // Will be loaded from StylePicker by generate route
        furniturePrompt: null,
        withFurniture: true,
        width: 1024,
        height: 768,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.error || "Generation failed", styleId },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      styleId,
      results: data.results?.length || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
