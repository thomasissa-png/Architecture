import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Accept both ?file= (admin page) and ?path= (galerie, biens, annonces, dossiers, compte)
  const file = req.nextUrl.searchParams.get("file") || req.nextUrl.searchParams.get("path");
  if (!file || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file parameter" }, { status: 400 });
  }

  // Normalize: accept either "logs/foo.jpg", "/logs/foo.jpg", or just "foo.jpg"
  // For pro plan paths like "pro/projects/xxx/plan-0.jpg", try raw path first
  const basename = file.split("/").pop() || file;
  const normalizedKey = `logs/${basename}`;

  // Diagnostic: detect null/undefined passed as string
  if (file === "null" || file === "undefined" || file === "") {
    console.error(`[/api/logs/image] DIAGNOSTIC: received file="${file}" — caller has a null/undefined output_image_key`);
    return NextResponse.json(
      { error: "Invalid file parameter: null/undefined key", detail: "The output_image_key in the database is likely NULL" },
      { status: 400 }
    );
  }

  // Build keys to try: raw path first (handles pro/ namespace), then normalized
  const keysToTry: string[] = [];
  // If the path contains a directory separator, it's a full path — try it first
  if (file.includes("/") && !file.startsWith("/")) {
    keysToTry.push(file);
  }
  // Add normalized key (logs/{basename}) only if not already present
  if (!keysToTry.includes(normalizedKey)) {
    keysToTry.push(normalizedKey);
  }
  // Also add raw path as last fallback if not already added
  if (!keysToTry.includes(file) && file !== normalizedKey && !file.startsWith("/")) {
    keysToTry.push(file);
  }

  try {
    console.log(`[/api/logs/image] Looking for file="${file}", keys to try: ${JSON.stringify(keysToTry)}`);
    for (const key of keysToTry) {
      const buffer = await getImage(key);
      if (buffer) {
        console.log(`[/api/logs/image] Found key="${key}", size=${buffer.length} bytes`);
        // Detect content type from extension
        const contentType = key.endsWith(".png") ? "image/png"
          : key.endsWith(".webp") ? "image/webp"
          : key.endsWith(".heic") || key.endsWith(".heif") ? "image/heic"
          : "image/jpeg";
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    console.warn(`/api/logs/image: 404 for keys ${JSON.stringify(keysToTry)} (file param: "${file}")`);
    return NextResponse.json(
      { error: "Image not found", keys: keysToTry, detail: "Key does not exist in Object Storage" },
      { status: 404 }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error(`/api/logs/image: 500 for keys ${JSON.stringify(keysToTry)}:`, detail);
    return NextResponse.json(
      { error: "Failed to fetch image", keys: keysToTry, detail },
      { status: 500 }
    );
  }
}
