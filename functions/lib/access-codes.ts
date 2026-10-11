import { sha256Hex } from "./password";

/**
 * Pro access codes.
 *
 * Format: SC-XXXX-XXXX over a 32-symbol alphabet (Crockford-style: no I, L, O, U),
 * giving 8 * 5 = 40 bits of entropy — enumeration is infeasible, and redemption is
 * additionally rate-limited per IP. Only sha256(code + pepper) is stored, so a
 * database leak does not leak codes, and the plaintext is shown exactly once at
 * creation.
 *
 * A code NEVER grants admin: redemption always creates a lightweight account with
 * role "pro" (product requirement).
 */

/** Crockford-style base32: all 10 digits + A–Z minus I, L, O, U = exactly 32 symbols. */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A random code like "SC-7K2M-9QRT" (crypto-strong, unambiguous characters). */
export function generateAccessCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const groups = [0, 4].map((offset) =>
    Array.from(bytes.slice(offset, offset + 4), (byte) => CODE_ALPHABET[byte % 32]).join(""),
  );
  return `SC-${groups[0]}-${groups[1]}`;
}

/** Accepts the canonical form, case-insensitively, with optional spaces/hyphens. */
export function normalizeAccessCode(input: string): string | null {
  const alphanumeric = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // The "SC" prefix is decorative: "SC-AAAA-BBBB" and "AAAABBBB" are the same code.
  const body = alphanumeric.startsWith("SC") ? alphanumeric.slice(2) : alphanumeric;
  if (body.length !== 8) {
    return null;
  }
  for (const char of body) {
    if (!CODE_ALPHABET.includes(char)) {
      return null;
    }
  }
  return `SC-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** The storage key for a code: sha256 hex of `code.pepper`. */
export function hashCode(code: string, pepper: string): Promise<string> {
  return sha256Hex(`${code}.${pepper}`);
}
