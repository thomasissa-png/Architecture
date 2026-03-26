import { NextResponse } from "next/server";
import { getPool, checkStorageHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout: ${label} n'a pas répondu en ${ms / 1000}s`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string; ms?: number }> = {};

  // Check PostgreSQL
  const pgStart = Date.now();
  try {
    const db = getPool();
    await withTimeout(db.query("SELECT 1"), 5_000, "PostgreSQL");
    checks.postgresql = { ok: true, ms: Date.now() - pgStart };
  } catch (err) {
    checks.postgresql = {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      ms: Date.now() - pgStart,
    };
  }

  // Check Object Storage
  const storageStart = Date.now();
  try {
    const result = await withTimeout(checkStorageHealth(), 10_000, "Object Storage");
    checks.objectStorage = { ...result, ms: Date.now() - storageStart };
  } catch (err) {
    checks.objectStorage = {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      ms: Date.now() - storageStart,
    };
  }

  // Check API keys
  checks.openaiKey = { ok: !!process.env.OPENAI_API_KEY };
  checks.replicateKey = { ok: !!process.env.REPLICATE_API_TOKEN };

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
