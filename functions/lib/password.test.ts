// @vitest-environment node

import { describe, expect, it } from "vitest";

import { timingSafeEqualHex } from "./timing";
import {
  DUMMY_HASH,
  DUMMY_SALT,
  generateSalt,
  generateSecret,
  hashClientCredential,
  isClientHash,
  isSalt,
  isSecretToken,
  sha256Hex,
  verifyClientCredential,
  verifySecretAsync,
} from "./password";

describe("password hashing", () => {
  it("hashes the client credential to a 64-character hex string, deterministically", async () => {
    const hash = await hashClientCredential("client-hash-value", "pepper-value");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashClientCredential("client-hash-value", "pepper-value")).toBe(hash);
    // The pepper changes the hash: a DB-only leak cannot verify guesses offline.
    expect(await hashClientCredential("client-hash-value", "other-pepper")).not.toBe(hash);
  });

  it("verifies a matching client credential and rejects a wrong one", async () => {
    const stored = await hashClientCredential("correct-hash", "pepper");
    expect(await verifyClientCredential("correct-hash", "pepper", stored)).toBe(true);
    expect(await verifyClientCredential("wrong-hash", "pepper", stored)).toBe(false);
  });

  it("sha256Hex matches a known vector", async () => {
    // sha256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("secrets and formats", () => {
  it("generates a 32-hex-character salt", () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(generateSalt()).not.toBe(salt);
  });

  it("generates 32-byte base64url secrets (43 characters)", () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateSecret()).not.toBe(secret);
  });

  it("validates the client hash, token and salt shapes", () => {
    expect(isClientHash(generateSecret())).toBe(true);
    expect(isClientHash("too-short")).toBe(false);
    expect(isClientHash("has spaces in it has spaces in it has!!")).toBe(false);
    expect(isSecretToken(generateSecret())).toBe(true);
    expect(isSalt(generateSalt())).toBe(true);
    expect(isSalt("not-hex")).toBe(false);
    expect(isSalt(DUMMY_SALT)).toBe(true);
  });

  it("dummy constants have valid shapes (they stand in for unknown accounts)", () => {
    expect(isSalt(DUMMY_SALT)).toBe(true);
    expect(DUMMY_HASH).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("timingSafeEqualHex", () => {
  it("accepts equal strings and rejects different ones", () => {
    expect(timingSafeEqualHex("abcd", "abcd")).toBe(true);
    expect(timingSafeEqualHex("abcd", "abce")).toBe(false);
    expect(timingSafeEqualHex("abcd", "abcd00")).toBe(false);
    expect(timingSafeEqualHex("", "")).toBe(true);
  });
});

describe("verifySecretAsync", () => {
  it("accepts the configured secret and rejects others, including when unset", async () => {
    expect(await verifySecretAsync("s3cret", "s3cret")).toBe(true);
    expect(await verifySecretAsync("wrong", "s3cret")).toBe(false);
    expect(await verifySecretAsync("anything", "")).toBe(false);
  });
});
