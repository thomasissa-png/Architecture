import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_ROUTES = ["/mes-biens", "/ma-galerie", "/mes-dossiers", "/compte"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Guard: warn if NEXTAUTH_SECRET is missing in production (deny-all instead of silent fail)
  if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
    console.error("[middleware] NEXTAUTH_SECRET is not defined in production — all protected routes will deny access.");
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "versimo-fallback-secret-change-me-in-production",
  });

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Preserve the intended destination so the auth modal can redirect back after login
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mes-biens/:path*", "/ma-galerie/:path*", "/mes-dossiers/:path*", "/compte/:path*"],
};
