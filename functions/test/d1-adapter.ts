// @vitest-environment node

import { DatabaseSync } from "node:sqlite";

/**
 * A minimal D1Database-compatible adapter over node:sqlite, so the auth functions run
 * against the REAL schema (functions/schema.sql) in unit tests. Only the D1 surface
 * the store layer uses is implemented: prepare/bind/first/all/run. node:sqlite is
 * experimental in Node 22 (a warning, not an error).
 */

type BindParam = string | number | null;

export function createTestDatabase(schemaSql: string): D1Database {
  const db = new DatabaseSync(":memory:");
  db.exec(schemaSql);

  return {
    prepare(sql: string) {
      const statement = db.prepare(sql);
      // D1 allows first/all/run directly on the statement (no bind) as well as after
      // bind(...); the store layer uses both shapes.
      const operations = (params: BindParam[]) => ({
        first: async <T>(): Promise<T | null> => (statement.get(...params) ?? null) as T | null,
        all: async <T>(): Promise<{ results: T[] }> => ({
          results: statement.all(...params) as T[],
        }),
        run: async (): Promise<{ success: boolean; meta: { changes: number } }> => {
          const result = statement.run(...params);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
      });
      return { bind: (...params: BindParam[]) => operations(params), ...operations([]) };
    },
  } as unknown as D1Database;
}
