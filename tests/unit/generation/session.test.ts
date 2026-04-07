/**
 * G4 — Session robuste — lib/session.ts
 *
 * Coverage: U-SE-001 to U-SE-005.
 *
 * We mock next-auth's getServerSession + next-auth/jwt's getToken to simulate
 * the 4 branches: OK, OK-fallback, both null, getToken throw, token without userId.
 *
 * The whole point of getSessionRobust is the JWT fallback (Replit getServerSession
 * is unreliable in production — session 31 bug). These tests guarantee that fix
 * never regresses.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const getServerSessionMock = vi.fn();
const getTokenMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => getTokenMock(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

beforeEach(() => {
  getServerSessionMock.mockReset();
  getTokenMock.mockReset();
});

function fakeRequest(): Request {
  return new Request("http://localhost/api/test", {
    headers: { cookie: "next-auth.session-token=fake" },
  });
}

describe("G4 — getSessionRobust", () => {
  it("U-SE-001: getServerSession OK → retourne session sans appeler getToken", async () => {
    const { getSessionRobust } = await import("@/lib/session");
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "u1", email: "a@b.fr" },
      expires: "2026-12-31",
    });
    const session = await getSessionRobust(fakeRequest());
    expect(session?.user?.id).toBe("u1");
    expect(getTokenMock).not.toHaveBeenCalled();
  });

  it("U-SE-002: getServerSession null + getToken OK → session reconstruite + warn log", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getSessionRobust } = await import("@/lib/session");
    getServerSessionMock.mockResolvedValueOnce(null);
    getTokenMock.mockResolvedValueOnce({
      userId: "u-fallback",
      email: "f@b.fr",
      name: "Fallback User",
    });
    const session = await getSessionRobust(fakeRequest());
    expect(session?.user?.id).toBe("u-fallback");
    expect(session?.user?.email).toBe("f@b.fr");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("U-SE-003: getServerSession null + getToken null → null", async () => {
    const { getSessionRobust } = await import("@/lib/session");
    getServerSessionMock.mockResolvedValueOnce(null);
    getTokenMock.mockResolvedValueOnce(null);
    const session = await getSessionRobust(fakeRequest());
    expect(session).toBeNull();
  });

  it("U-SE-004: getToken throw → null sans crash + error log", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getSessionRobust } = await import("@/lib/session");
    getServerSessionMock.mockResolvedValueOnce(null);
    getTokenMock.mockRejectedValueOnce(new Error("jwt decode failed"));
    const session = await getSessionRobust(fakeRequest());
    expect(session).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("U-SE-005: token sans userId → null (pas de fabrication)", async () => {
    const { getSessionRobust } = await import("@/lib/session");
    getServerSessionMock.mockResolvedValueOnce(null);
    getTokenMock.mockResolvedValueOnce({ email: "x@y.fr" }); // pas de userId
    const session = await getSessionRobust(fakeRequest());
    expect(session).toBeNull();
  });
});
