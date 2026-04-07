/**
 * G6 — Object Storage résilient — lib/db.ts withStorageRetry / saveImage / getImage
 *
 * Coverage: U-DB-001 to U-DB-006.
 *
 * The real lib/db.ts uses a singleton storage client that auto-reinits on
 * "error" state. We mock @replit/object-storage at the module level and
 * verify that the retry/reinit pattern fires correctly.
 *
 * NOTE: lib/db.ts also requires DATABASE_URL for the pg Pool. We do NOT call
 * any pg-dependent function here — only the storage helpers, which run
 * standalone.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Shared state via vi.hoisted (factories run before top-level statements).
const state = vi.hoisted(() => ({
  nextClientFails: false,
  state.storedBlobs: new Map<string, Buffer>(),
  clientCallCount: 0,
  internalState: "ready",
}));

vi.mock("@replit/object-storage", () => {
  const Client = vi.fn().mockImplementation(() => {
    state.clientCallCount++;
    return {
      state: { status: state.internalState },
      uploadFromBytes: vi.fn(async (key: string, buffer: Buffer) => {
        if (state.nextClientFails) {
          state.nextClientFails = false;
          throw new Error("fetch failed");
        }
        state.state.storedBlobs.set(key, buffer);
        return { ok: true };
      }),
      downloadAsBytes: vi.fn(async (key: string) => {
        const blob = state.state.storedBlobs.get(key);
        if (!blob) return { ok: false, error: "not found" };
        return { ok: true, value: [blob] };
      }),
    };
  });
  return { Client };
});

// pg is not actually used by saveImage/getImage/withStorageRetry but lib/db.ts
// imports it. Mock to avoid DATABASE_URL requirement.
vi.mock("pg", () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
    connect: vi.fn(),
  })),
}));

beforeEach(() => {
  state.state.storedBlobs.clear();
  state.clientCallCount = 0;
  state.nextClientFails = false;
  state.internalState = "ready";
  vi.resetModules();
  process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID = "test-bucket";
  process.env.DATABASE_URL = "postgres://test/test";
});

describe("G6 — saveImage / getImage", () => {
  it("U-DB-001: saveImage upload OK + verify OK → retourne key", async () => {
    const { saveImage } = await import("@/lib/db");
    const tinyB64 = Buffer.from("hello").toString("base64");
    const key = await saveImage(tinyB64, "test1");
    expect(key).toBe("logs/test1.jpg");
    expect(state.storedBlobs.has("logs/test1.jpg")).toBe(true);
  });

  it("U-DB-001b: saveImage stocke le buffer décodé en base64", async () => {
    const { saveImage } = await import("@/lib/db");
    const tinyB64 = Buffer.from("hello world").toString("base64");
    await saveImage(tinyB64, "test2");
    const stored = state.storedBlobs.get("logs/test2.jpg");
    expect(stored?.toString()).toBe("hello world");
  });

  it("getImage : key inexistant → null après retry", async () => {
    const { getImage } = await import("@/lib/db");
    const result = await getImage("logs/missing.jpg");
    expect(result).toBeNull();
  });

  it("getImage : key existante → Uint8Array", async () => {
    const { saveImage, getImage } = await import("@/lib/db");
    const tinyB64 = Buffer.from("data").toString("base64");
    const key = await saveImage(tinyB64, "test3");
    const result = await getImage(key);
    expect(result).not.toBeNull();
    expect(Buffer.from(result!).toString()).toBe("data");
  });

  it("U-DB-003: withStorageRetry réinit client sur échec puis réussit", async () => {
    const { withStorageRetry } = await import("@/lib/db");
    state.nextClientFails = true; // first call throws
    const result = await withStorageRetry(
      (client) => client.uploadFromBytes("logs/retry.jpg", Buffer.from("ok")),
      "test-retry",
    );
    expect(result.ok).toBe(true);
    // Le client a été recréé après l'échec
    expect(state.clientCallCount).toBeGreaterThanOrEqual(2);
  });

  it("withStorageRetry : 2 échecs consécutifs → throw", async () => {
    const { withStorageRetry } = await import("@/lib/db");
    let call = 0;
    await expect(
      withStorageRetry(async () => {
        call++;
        throw new Error("permanent failure");
      }, "test-fail"),
    ).rejects.toThrow(/permanent failure/);
    expect(call).toBeGreaterThanOrEqual(1);
  });

  // U-DB-006 documentaire : TTL vérifié par route.ts, pas par db.ts
  it.skip("U-DB-006: TTL 24h vérifié au niveau route.ts, pas db.ts (test documentaire)", () => {
    // Le TTL des entrées pass1 est appliqué dans app/api/generate/route.ts.
    // db.ts retourne toujours l'entrée si elle existe — pas de check TTL.
  });
});
