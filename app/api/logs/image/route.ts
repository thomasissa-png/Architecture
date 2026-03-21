import { NextRequest, NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  if (!file || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file parameter" }, { status: 400 });
  }

  const basename = path.basename(file);
  const filePath = path.join(process.cwd(), "public", "logs", basename);

  try {
    await access(filePath);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Image not found", path: filePath, cwd: process.cwd() },
      { status: 404 }
    );
  }
}
