import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  if (!file || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file parameter" }, { status: 400 });
  }

  // Normalize: accept either "logs/foo.jpg", "/logs/foo.jpg", or just "foo.jpg"
  const basename = file.split("/").pop() || file;
  const key = `logs/${basename}`;

  try {
    const buffer = await getImage(key);
    if (!buffer) {
      console.warn(`/api/logs/image: 404 for key "${key}" (file param: "${file}")`);
      return NextResponse.json({ error: "Image not found", key, detail: "Key does not exist in database" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error(`/api/logs/image: 500 for key "${key}":`, detail);
    return NextResponse.json(
      { error: "Failed to fetch image", key, detail },
      { status: 500 }
    );
  }
}
