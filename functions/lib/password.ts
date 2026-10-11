import { timingSafeEqualHex } from "./timing";

/**
 * Password handling (Milestone 5, security-reviewed design).
 *
 * The browser derives `clientHash = base64url(PBKDF2-SHA256(NFKC(password), salt,
 * 600000 iterations, 256 bits))` — the server never sees the raw password, and the
 * 600 000-iteration work factor (OWASP's minimum for PBKDF2-SHA256) stays in the
 * browser, because 600 000 server-side iterations would exceed the Workers free CPU
 * limit by ~11x. The server stores `sha256hex(clientHash + "." + PASSWORD_PEPPER)`, so
 * a database-only leak cannot be used to verify guesses offline.
 *
 * The salt contract with the client (src/lib/password.ts): 16 random bytes as 32 hex
 * characters; the client hash is base64url of 32 bytes (43 characters).
 */
export const PBKDF2_ITERATIONS = 600_000;
export const SALT_BYTES = 16;
/** Salt returned by prelogin for unknown emails, so the client does identical work. */
export const DUMMY_SALT = "00000000000000000000000000000000";
/** Hash compared against when the email is unknown, so timing does not reveal it. */
export const DUMMY_HASH = "5f4dcc3b5aa765d61d8327deb882cf99a1b2c3d4e5f60718293a4b5c6d7e8f90";

export function generateSalt(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

/** 32 random bytes as base64url — session ids and one-time tokens. */
export function generateSecret(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return bytesToHex(new Uint8Array(digest));
}

/** The stored password hash: SHA-256 over the client hash and the server pepper. */
export async function hashClientCredential(clientHash: string, pepper: string): Promise<string> {
  return sha256Hex(`${clientHash}.${pepper}`);
}

export async function verifyClientCredential(
  clientHash: string,
  pepper: string,
  storedHash: string,
): Promise<boolean> {
  const computed = await hashClientCredential(clientHash, pepper);
  return timingSafeEqualHex(computed, storedHash);
}

/**
 * Constant-time comparison of a caller-supplied secret (the setup secret) with the
 * configured one. Hashing both sides first keeps the comparison length-independent.
 */
export async function verifySecretAsync(candidate: string, expected: string): Promise<boolean> {
  if (expected.length === 0) {
    return false;
  }
  const [candidateHash, expectedHash] = await Promise.all([
    sha256Hex(candidate),
    sha256Hex(expected),
  ]);
  return timingSafeEqualHex(candidateHash, expectedHash);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** Validates the client-hash shape: base64url of 32 bytes (43 characters). */
export function isClientHash(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Validates the token shape: base64url of 32 bytes (43 characters). */
export function isSecretToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Validates the salt shape: 32 hex characters. */
export function isSalt(value: string): boolean {
  return /^[0-9a-f]{32}$/.test(value);
}
