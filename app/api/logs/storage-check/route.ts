import { NextResponse } from "next/server";
import { checkStorageHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.ADMIN_PASSWORD && token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkStorageHealth();
  if (!result.ok) {
    return NextResponse.json(
      { status: "error", detail: result.error },
      { status: 500 }
    );
  }
  return NextResponse.json({ status: "ok", message: "Object Storage is operational" });
}
