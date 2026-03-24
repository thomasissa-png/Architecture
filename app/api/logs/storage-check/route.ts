import { NextResponse } from "next/server";
import { Client as StorageClient } from "@replit/object-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = new StorageClient();
    const testKey = "logs/__storage_test";
    const testBuffer = Buffer.from("ok", "utf-8");

    const uploadResult = await client.uploadFromBytes(testKey, testBuffer);
    if (!uploadResult.ok) {
      return NextResponse.json(
        { status: "error", detail: "Upload test failed", error: String(uploadResult.error) },
        { status: 500 }
      );
    }

    const downloadResult = await client.downloadAsBytes(testKey);
    if (!downloadResult.ok) {
      return NextResponse.json(
        { status: "error", detail: "Download test failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "ok", message: "Object Storage is operational" });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
