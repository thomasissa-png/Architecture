/**
 * Tests auth et rate limit pour lib/marchand/auth-helpers.ts
 *
 * Couvre :
 * - requireAuth : 401 sans session, retourne AuthenticatedUser avec session valide
 * - isErrorResponse : type guard NextResponse vs objet
 * - requireProjectOwnership : 403 si pas proprietaire, 404 si projet introuvable
 * - checkRateLimit : autorise puis bloque apres N appels, reset apres window
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ─── Mocks ─────────────────────────────────────────────────────────

const getSessionRobustMock = vi.fn();
const queryMock = vi.fn();

vi.mock("@/lib/session", () => ({
  getSessionRobust: (...args: unknown[]) => getSessionRobustMock(...args),
}));

vi.mock("@/lib/db", () => ({
  getPool: () => ({
    query: queryMock,
  }),
  ensureTable: vi.fn().mockResolvedValue(undefined),
}));

// ensureProTables needs to be mocked because it calls ensureBaseTable + getPool
vi.mock("@/lib/marchand/db", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/marchand/db")>();
  return {
    ...orig,
    ensureProTables: vi.fn().mockResolvedValue(undefined),
  };
});

import {
  requireAuth,
  isErrorResponse,
  requireProjectOwnership,
  checkRateLimit,
  type AuthenticatedUser,
} from "@/lib/marchand/auth-helpers";

// ─── Setup ─────────────────────────────────────────────────────────

beforeEach(() => {
  getSessionRobustMock.mockReset();
  queryMock.mockReset();
  queryMock.mockResolvedValue({ rows: [] });
});

function fakeRequest(): Request {
  return new Request("http://localhost/api/pro/projects", { method: "GET" });
}

// ─── requireAuth ──────────────────────────────────────────────────

describe("requireAuth", () => {
  it("retourne 401 quand session est null", async () => {
    getSessionRobustMock.mockResolvedValueOnce(null);

    const result = await requireAuth(fakeRequest());

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("UNAUTHENTICATED");
  });

  it("retourne 401 quand session.user est null", async () => {
    getSessionRobustMock.mockResolvedValueOnce({ user: null });

    const result = await requireAuth(fakeRequest());
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("retourne 401 quand session.user.id est manquant", async () => {
    getSessionRobustMock.mockResolvedValueOnce({ user: { email: "test@test.com" } });

    const result = await requireAuth(fakeRequest());
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("retourne AuthenticatedUser avec session valide", async () => {
    getSessionRobustMock.mockResolvedValueOnce({
      user: { id: "user-123", email: "thomas@versimo.fr", name: "Thomas Berger" },
    });

    const result = await requireAuth(fakeRequest());

    expect(result).not.toBeInstanceOf(NextResponse);
    const user = result as AuthenticatedUser;
    expect(user.id).toBe("user-123");
    expect(user.email).toBe("thomas@versimo.fr");
    expect(user.name).toBe("Thomas Berger");
  });

  it("retourne email et name vides si absents de la session", async () => {
    getSessionRobustMock.mockResolvedValueOnce({
      user: { id: "user-456" },
    });

    const result = await requireAuth(fakeRequest());

    expect(result).not.toBeInstanceOf(NextResponse);
    const user = result as AuthenticatedUser;
    expect(user.id).toBe("user-456");
    expect(user.email).toBe("");
    expect(user.name).toBe("");
  });
});

// ─── isErrorResponse ──────────────────────────────────────────────

describe("isErrorResponse", () => {
  it("retourne true pour un NextResponse", () => {
    const resp = NextResponse.json({ error: "test" }, { status: 400 });
    expect(isErrorResponse(resp)).toBe(true);
  });

  it("retourne false pour un objet utilisateur", () => {
    const user: AuthenticatedUser = { id: "u1", email: "a@b.com", name: "Test" };
    expect(isErrorResponse(user)).toBe(false);
  });

  it("retourne false pour un objet quelconque", () => {
    expect(isErrorResponse({ foo: "bar" })).toBe(false);
  });
});

// ─── requireProjectOwnership ──────────────────────────────────────

describe("requireProjectOwnership", () => {
  it("retourne 401 si pas authentifie", async () => {
    getSessionRobustMock.mockResolvedValueOnce(null);

    const result = await requireProjectOwnership(fakeRequest(), "proj-1");

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("retourne 404 si projet introuvable", async () => {
    getSessionRobustMock.mockResolvedValueOnce({
      user: { id: "user-1", email: "a@b.com", name: "Test" },
    });
    // Project SELECT returns empty
    queryMock.mockResolvedValueOnce({ rows: [] });

    const result = await requireProjectOwnership(fakeRequest(), "proj-nonexistent");

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
    const body = await (result as NextResponse).json();
    expect(body.error).toBe("NOT_FOUND");
  });

  it("retourne 403 si pas proprietaire du projet", async () => {
    getSessionRobustMock.mockResolvedValueOnce({
      user: { id: "user-hacker", email: "hacker@evil.com", name: "Hacker" },
    });
    // Project found
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "proj-1", status: "validated", type_bien: "appartement",
        plan_file_path: null, plan_mime_type: null,
        adresse: "5 rue Test", surface_totale: null,
      }],
    });
    // Ownership check fails
    queryMock.mockResolvedValueOnce({ rows: [] });

    const result = await requireProjectOwnership(fakeRequest(), "proj-1");

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
    const body = await (result as NextResponse).json();
    expect(body.error).toBe("UNAUTHORIZED");
  });

  it("retourne ProjectOwnershipResult si proprietaire", async () => {
    getSessionRobustMock.mockResolvedValueOnce({
      user: { id: "user-owner", email: "owner@versimo.fr", name: "Thomas" },
    });
    // Project found
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "proj-1", status: "qualified", type_bien: "immeuble",
        plan_file_path: "logs/plan.jpg", plan_mime_type: "image/jpeg",
        adresse: "10 rue de Bordeaux", surface_totale: "120.50",
      }],
    });
    // Ownership check passes
    queryMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const result = await requireProjectOwnership(fakeRequest(), "proj-1");

    expect(result).not.toBeInstanceOf(NextResponse);
    const ownership = result as {
      user: AuthenticatedUser;
      project: { id: string; status: string; adresse: string; surface_totale: number | null };
    };
    expect(ownership.user.id).toBe("user-owner");
    expect(ownership.project.id).toBe("proj-1");
    expect(ownership.project.status).toBe("qualified");
    expect(ownership.project.adresse).toBe("10 rue de Bordeaux");
    expect(ownership.project.surface_totale).toBe(120.50);
  });

  it("retourne surface_totale null si absent", async () => {
    getSessionRobustMock.mockResolvedValueOnce({
      user: { id: "user-1", email: "a@b.com", name: "Test" },
    });
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "proj-2", status: "plan_uploaded", type_bien: "maison",
        plan_file_path: null, plan_mime_type: null,
        adresse: "1 rue Test", surface_totale: null,
      }],
    });
    queryMock.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const result = await requireProjectOwnership(fakeRequest(), "proj-2");
    expect(result).not.toBeInstanceOf(NextResponse);
    const ownership = result as { project: { surface_totale: number | null } };
    expect(ownership.project.surface_totale).toBeNull();
  });
});

// ─── checkRateLimit ───────────────────────────────────────────────

describe("checkRateLimit", () => {
  it("autorise la premiere requete", () => {
    const result = checkRateLimit("test-ns-1", "key-1", 3, 60_000);
    expect(result).toBe(true);
  });

  it("autorise jusqu'a maxRequests", () => {
    const ns = "test-ns-2";
    const key = "key-a";
    expect(checkRateLimit(ns, key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(ns, key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(ns, key, 3, 60_000)).toBe(true);
  });

  it("bloque apres maxRequests atteint", () => {
    const ns = "test-ns-3";
    const key = "key-b";
    checkRateLimit(ns, key, 2, 60_000);
    checkRateLimit(ns, key, 2, 60_000);
    const result = checkRateLimit(ns, key, 2, 60_000);
    expect(result).toBe(false);
  });

  it("autorise des cles differentes independamment", () => {
    const ns = "test-ns-4";
    checkRateLimit(ns, "key-c", 1, 60_000);
    // key-c is now at limit
    expect(checkRateLimit(ns, "key-c", 1, 60_000)).toBe(false);
    // key-d is independent
    expect(checkRateLimit(ns, "key-d", 1, 60_000)).toBe(true);
  });

  it("autorise des namespaces differents independamment", () => {
    checkRateLimit("ns-a", "same-key", 1, 60_000);
    expect(checkRateLimit("ns-a", "same-key", 1, 60_000)).toBe(false);
    // Different namespace, same key
    expect(checkRateLimit("ns-b", "same-key", 1, 60_000)).toBe(true);
  });

  it("reset apres expiration de la window", () => {
    const ns = "test-ns-5";
    const key = "key-e";
    // Use a very short window
    checkRateLimit(ns, key, 1, 1); // 1ms window

    // Wait for expiration — we use vi.advanceTimersByTime or just trust the next call
    // Actually, since the window is 1ms, by the time we call again it should be expired
    // To be safe, use fake timers
    vi.useFakeTimers();
    checkRateLimit(ns, key, 1, 100);
    expect(checkRateLimit(ns, key, 1, 100)).toBe(false); // blocked

    vi.advanceTimersByTime(150); // past the window
    expect(checkRateLimit(ns, key, 1, 100)).toBe(true); // allowed again

    vi.useRealTimers();
  });
});
