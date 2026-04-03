/**
 * Robust session retrieval for Versimo API routes.
 *
 * getServerSession from next-auth is unreliable on Replit — it sporadically
 * returns null even for authenticated users. This helper tries getServerSession
 * first, then falls back to decoding the JWT token directly from cookies.
 */
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "versimo-fallback-secret-change-me-in-production";

export async function getSessionRobust(request: Request) {
  // Try getServerSession first (standard next-auth approach)
  let session = await getServerSession(authOptions);

  // Fallback: decode JWT directly from cookies (more reliable on Replit)
  if (!session) {
    try {
      const token = await getToken({ req: request as NextRequest, secret: AUTH_SECRET });
      if (token?.userId) {
        session = {
          user: {
            id: token.userId as string,
            email: (token.email as string) || "",
            name: (token.name as string) || "",
          },
          expires: "",
        };
        console.warn(`[auth] getServerSession null — JWT fallback userId="${token.userId}"`);
      }
    } catch (err) {
      console.error("[auth] getToken fallback failed:", err);
    }
  }

  return session;
}
