import { NextRequest, NextResponse } from "next/server";

// ─── Rate limiting (in-memory, per IP) ───────────────────────────────
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  loginAttempts.forEach((entry, ip) => {
    if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  });
}

function isRateLimited(ip: string): boolean {
  cleanupStaleEntries();
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }

  entry.count++;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const { password } = (await request.json()) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured" },
      { status: 500 }
    );
  }

  if (password === expected) {
    // Reset counter on successful login
    loginAttempts.delete(ip);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
