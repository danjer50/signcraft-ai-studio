import type { Env } from "../env";

import { tooManyRequests } from "./errors";
import { isoFromMs, parseIso } from "./session";

/**
 * Rate limiting for the auth API (security-review amendment: in-isolate memory
 * fast-path + D1 backstop).
 *
 * Two key families: per email (or per token) and per IP. The D1 `rate_limits` table
 * is the source of truth across isolates; the in-memory map answers repeat offenders
 * in the same isolate without a D1 read. Counting is per fixed window: a key that
 * reaches the limit is blocked until its window expires.
 */

export type RateLimitKey =
  `login:ip:${string}` | `login:email:${string}` | `setup:ip:${string}` | `token:ip:${string}`;

interface MemoryEntry {
  windowStartMs: number;
  failures: number;
}

const memory = new Map<RateLimitKey, MemoryEntry>();

export interface RateLimitConfig {
  maxAttempts: number;
  ipMaxAttempts: number;
  windowMs: number;
}

export function rateLimitConfig(env: Env): RateLimitConfig {
  return {
    maxAttempts: positiveInt(env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 5),
    ipMaxAttempts: positiveInt(env.AUTH_RATE_LIMIT_IP_MAX_ATTEMPTS, 20),
    windowMs: positiveInt(env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  };
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** The caller's IP: Cloudflare's header first, then the first X-Forwarded-For entry. */
export function clientIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return "unknown";
}

interface RateLimitRow {
  key: string;
  window_start: string;
  failures: number;
}

async function readRow(db: D1Database, key: RateLimitKey): Promise<RateLimitRow | null> {
  return db
    .prepare("SELECT key, window_start, failures FROM rate_limits WHERE key = ?")
    .bind(key)
    .first<RateLimitRow>();
}

/** True when the key has reached its limit inside the current window. */
export async function isRateLimited(
  db: D1Database,
  key: RateLimitKey,
  maxAttempts: number,
  windowMs: number,
  nowMs: number = Date.now(),
): Promise<boolean> {
  // Fast path: this isolate already knows the key is blocked.
  const entry = memory.get(key);
  if (entry && entry.failures >= maxAttempts && nowMs - entry.windowStartMs < windowMs) {
    return true;
  }
  const row = await readRow(db, key);
  if (!row) {
    return false;
  }
  if (nowMs - parseIso(row.window_start) >= windowMs) {
    return false;
  }
  return row.failures >= maxAttempts;
}

/** Throws 429 when the key is blocked. */
export async function assertNotRateLimited(
  db: D1Database,
  key: RateLimitKey,
  maxAttempts: number,
  windowMs: number,
  nowMs: number = Date.now(),
): Promise<void> {
  if (await isRateLimited(db, key, maxAttempts, windowMs, nowMs)) {
    throw tooManyRequests();
  }
}

/** Records one failure for the key, in memory and in D1. */
export async function recordFailure(
  db: D1Database,
  key: RateLimitKey,
  windowMs: number,
  nowMs: number = Date.now(),
): Promise<void> {
  const entry = memory.get(key);
  if (entry && nowMs - entry.windowStartMs < windowMs) {
    entry.failures += 1;
  } else {
    memory.set(key, { windowStartMs: nowMs, failures: 1 });
  }

  const row = await readRow(db, key);
  if (!row || nowMs - parseIso(row.window_start) >= windowMs) {
    await db
      .prepare(
        "INSERT INTO rate_limits (key, window_start, failures) VALUES (?, ?, 1) " +
          "ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, failures = 1",
      )
      .bind(key, isoFromMs(nowMs))
      .run();
  } else {
    await db
      .prepare("UPDATE rate_limits SET failures = failures + 1 WHERE key = ?")
      .bind(key)
      .run();
  }
}

/** Clears the keys after a success, so a correct password is never punished. */
export async function clearRateLimits(db: D1Database, keys: RateLimitKey[]): Promise<void> {
  for (const key of keys) {
    memory.delete(key);
  }
  if (keys.length === 0) {
    return;
  }
  const placeholders = keys.map(() => "?").join(", ");
  await db
    .prepare(`DELETE FROM rate_limits WHERE key IN (${placeholders})`)
    .bind(...keys)
    .run();
}

/** Test helper: clears the in-isolate fast-path map between test cases. */
export function resetRateLimitMemory(): void {
  memory.clear();
}
