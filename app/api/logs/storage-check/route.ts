import { NextResponse } from "next/server";
import { checkStorageHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkStorageHealth();
  if (!result.ok) {
    return NextResponse.json(
      { status: "error", detail: result.error },
      { status: 500 }
    );
  }
  return NextResponse.json({ status: "ok", message: "PostgreSQL storage is operational" });
}
