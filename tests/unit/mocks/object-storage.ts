/**
 * Mock for @replit/object-storage StorageClient.
 *
 * Simulates the real SDK's failure modes:
 * - "healthy"   → upload/download succeed
 * - "error"     → SDK enters internal error state (state.status === "error")
 * - "recovered" → first call fails, then a fresh client succeeds
 */
import { vi } from "vitest";

export type StorageState = "healthy" | "error" | "recovered";

export interface MockStorageClient {
  state: { status: string };
  uploadFromBytes: ReturnType<typeof vi.fn>;
  downloadAsBytes: ReturnType<typeof vi.fn>;
}

export function createMockStorage(initialState: StorageState = "healthy") {
  let callCount = 0;
  let mode: StorageState = initialState;
  const storedBlobs = new Map<string, Buffer>();

  const factory = vi.fn(() => {
    callCount++;
    const client: MockStorageClient = {
      state: { status: mode === "error" ? "error" : "ready" },
      uploadFromBytes: vi.fn(async (key: string, buffer: Buffer) => {
        if (mode === "error") {
          return { ok: false, error: "fetch failed" };
        }
        storedBlobs.set(key, buffer);
        return { ok: true };
      }),
      downloadAsBytes: vi.fn(async (key: string) => {
        if (mode === "error") {
          return { ok: false, error: "fetch failed" };
        }
        const blob = storedBlobs.get(key);
        if (!blob) {
          return { ok: false, error: "not found" };
        }
        return { ok: true, value: [blob] };
      }),
    };
    return client;
  });

  return {
    factory,
    storedBlobs,
    /** Toggle the mode for next client created via factory(). */
    setMode(next: StorageState) {
      mode = next;
    },
    get callCount() {
      return callCount;
    },
    /** Simulate "recovered" : first client fails, second one succeeds. */
    triggerRecovery() {
      mode = "healthy";
    },
  };
}
