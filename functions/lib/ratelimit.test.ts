// @vitest-environment node

import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it } from "vitest";

import { createTestDatabase } from "../test/d1-adapter";
import {
  assertNotRateLimited,
  clearRateLimits,
  clientIp,
  isRateLimited,
  recordFailure,
  resetRateLimitMemory,
} from "./ratelimit";
import { ApiError } from "./errors";

const schemaSql = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

const WINDOW_MS = 15 * 60 * 1000;
const MAX = 5;

describe("rate limiting (D1 backstop + memory fast-path)", () => {
  beforeEach(() => {
    resetRateLimitMemory();
  });

  it("blocks a key after MAX failures inside the window", async () => {
    const db = createTestDatabase(schemaSql);
    const key = "login:email:aaaa" as const;
    const now = Date.parse("2026-01-01T00:00:00.000Z");

    for (let attempt = 1; attempt <= MAX; attempt += 1) {
      await assertNotRateLimited(db, key, MAX, WINDOW_MS, now + attempt);
      await recordFailure(db, key, WINDOW_MS, now + attempt);
    }
    expect(await isRateLimited(db, key, MAX, WINDOW_MS, now + MAX + 1)).toBe(true);
    await expect(
      assertNotRateLimited(db, key, MAX, WINDOW_MS, now + MAX + 1),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("allows the key again after the window expires", async () => {
    const db = createTestDatabase(schemaSql);
    const key = "login:email:bbbb" as const;
    const now = Date.parse("2026-01-01T00:00:00.000Z");

    for (let attempt = 1; attempt <= MAX; attempt += 1) {
      await recordFailure(db, key, WINDOW_MS, now + attempt);
    }
    expect(await isRateLimited(db, key, MAX, WINDOW_MS, now + WINDOW_MS + 1)).toBe(false);
  });

  it("clears keys after a success", async () => {
    const db = createTestDatabase(schemaSql);
    const key = "login:email:cccc" as const;
    const now = Date.parse("2026-01-01T00:00:00.000Z");

    for (let attempt = 1; attempt <= MAX; attempt += 1) {
      await recordFailure(db, key, WINDOW_MS, now + attempt);
    }
    expect(await isRateLimited(db, key, MAX, WINDOW_MS, now + MAX + 1)).toBe(true);
    await clearRateLimits(db, [key]);
    expect(await isRateLimited(db, key, MAX, WINDOW_MS, now + MAX + 2)).toBe(false);
  });

  it("tracks keys independently", async () => {
    const db = createTestDatabase(schemaSql);
    const keyA = "login:email:dddd" as const;
    const keyB = "login:email:eeee" as const;
    const now = Date.parse("2026-01-01T00:00:00.000Z");

    await recordFailure(db, keyA, WINDOW_MS, now);
    expect(await isRateLimited(db, keyA, MAX, WINDOW_MS, now + 1)).toBe(false);
    expect(await isRateLimited(db, keyB, MAX, WINDOW_MS, now + 1)).toBe(false);
  });

  it("reads the caller IP from CF-Connecting-IP, then X-Forwarded-For", () => {
    expect(
      clientIp(
        new Request("https://studio.test/api/auth/login", {
          headers: { "cf-connecting-ip": "203.0.113.7" },
        }),
      ),
    ).toBe("203.0.113.7");
    expect(
      clientIp(
        new Request("https://studio.test/api/auth/login", {
          headers: { "x-forwarded-for": "198.51.100.3, 10.0.0.1" },
        }),
      ),
    ).toBe("198.51.100.3");
    expect(clientIp(new Request("https://studio.test/api/auth/login"))).toBe("unknown");
  });
});
