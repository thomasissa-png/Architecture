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

  // Try normalized key first, then raw key as fallback (in case the stored key
  // uses a different prefix than "logs/")
  const keysToTry = [normalizedKey];
  if (file !== normalizedKey && !file.startsWith("/")) {
    keysToTry.push(file);
  }

  try {
    console.log(`[/api/logs/image] Looking for file="${file}", keys to try: ${JSON.stringify(keysToTry)}`);
    for (const key of keysToTry) {
      const buffer = await getImage(key);
      if (buffer) {
        console.log(`[/api/logs/image] Found key="${key}", size=${buffer.length} bytes`);
        // Detect content type from extension
        const contentType = key.endsWith(".png") ? "image/png" : "image/jpeg";
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
