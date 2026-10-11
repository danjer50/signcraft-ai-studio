// @vitest-environment node

import { pbkdf2Sync } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  PBKDF2_ITERATIONS,
  prehashPassword,
  validatePassword,
} from "./password";

/**
 * The client pre-hash must match the server-side contract exactly:
 * base64url(PBKDF2-SHA256(NFKC(password), salt, 600000, 256 bits)). These tests
 * recompute it with Node's crypto and compare, so a change on either side breaks
 * the build instead of breaking logins at runtime.
 */
describe("validatePassword", () => {
  it("requires at least MIN_PASSWORD_LENGTH characters", () => {
    expect(validatePassword("x".repeat(MIN_PASSWORD_LENGTH - 1))).toBe("password_too_short");
    expect(validatePassword("x".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
    expect(validatePassword("a much longer passphrase")).toBeNull();
  });
});

describe("prehashPassword", () => {
  it("produces the base64url PBKDF2-SHA256 client hash (43 characters)", async () => {
    const salt = "0123456789abcdef0123456789abcdef";
    const hash = await prehashPassword("correct horse battery staple", salt);
    expect(hash).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const expected = pbkdf2Sync(
      Buffer.from("correct horse battery staple".normalize("NFKC"), "utf8"),
      Buffer.from(salt, "hex"),
      PBKDF2_ITERATIONS,
      32,
      "sha256",
    ).toString("base64url");
    expect(hash).toBe(expected);
  });

  it("is deterministic per password+salt and changes with either", async () => {
    const salt = "0123456789abcdef0123456789abcdef";
    const hash = await prehashPassword("correct horse battery staple", salt);
    expect(await prehashPassword("correct horse battery staple", salt)).toBe(hash);
    expect(await prehashPassword("correct horse battery staple!", salt)).not.toBe(hash);
    expect(
      await prehashPassword("correct horse battery staple", "ffffffffffffffffffffffffffffffff"),
    ).not.toBe(hash);
  });

  it("normalises the password to NFKC before hashing", async () => {
    // "é" as e + combining accent (NFD) must hash like the precomposed form (NFC).
    const salt = "0123456789abcdef0123456789abcdef";
    const decomposed = await prehashPassword("café password 123", salt);
    const composed = await prehashPassword("café password 123".normalize("NFC"), salt);
    expect(decomposed).toBe(composed);
  });
});
