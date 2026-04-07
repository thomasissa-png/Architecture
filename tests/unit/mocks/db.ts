/**
 * Reusable PostgreSQL Pool mock for tests of lib/credits.ts and similar.
 *
 * The real lib/db.ts exports getPool() returning a `pg` Pool. We mock the
 * `query` method to return canned results. Tests configure the queue of
 * responses, then assert that the right SQL was called.
 */
import { vi } from "vitest";

export interface MockQueryResult {
  rows: Record<string, unknown>[];
  rowCount?: number;
}

export interface MockPool {
  query: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  __queue: MockQueryResult[];
  __calls: { sql: string; params?: unknown[] }[];
}

export function createMockPool(): MockPool {
  const queue: MockQueryResult[] = [];
  const calls: { sql: string; params?: unknown[] }[] = [];

  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    calls.push({ sql, params });
    const next = queue.shift();
    if (!next) {
      return { rows: [], rowCount: 0 };
    }
    return { rows: next.rows, rowCount: next.rowCount ?? next.rows.length };
  });

  const connect = vi.fn(async () => ({
    query,
    release: vi.fn(),
  }));

  return { query, connect, __queue: queue, __calls: calls };
}

/**
 * Helper to seed the queue. Each call to pool.query consumes one entry.
 */
export function enqueue(pool: MockPool, ...results: MockQueryResult[]) {
  pool.__queue.push(...results);
}
