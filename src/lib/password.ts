/**
 * Browser-side password pre-hashing (Milestone 5, security-reviewed design).
 *
 * The raw password never leaves the browser as a password: the client derives
 * `clientHash = base64url(PBKDF2-SHA256(NFKC(password), salt, 600 000 iterations,
 * 256 bits))` and sends only that. The server stores
 * `sha256hex(clientHash + "." + PASSWORD_PEPPER)` — see functions/lib/password.ts.
 *
 * 600 000 iterations is OWASP's minimum work factor for PBKDF2-SHA256. It runs here,
 * in the browser, because the same work on the Workers free tier would exceed the
 * 10 ms CPU limit by ~11x. The trade-off is documented in docs/ARCHITECTURE.md:
 * the client hash is replayable, but it is site-specific (per-account salt + server
 * pepper) and only ever travels over TLS.
 *
 * The salt contract with the server: 16 random bytes as 32 hex characters, returned
 * by /api/auth/prelogin (or the setup/set-password endpoints).
 */

export const MIN_PASSWORD_LENGTH = 12;
export const PBKDF2_ITERATIONS = 600_000;

/** Returns an error message key when the password is not acceptable, else null. */
export function validatePassword(password: string): "password_too_short" | null {
  return password.length >= MIN_PASSWORD_LENGTH ? null : "password_too_short";
}

export async function prehashPassword(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256,
  );
  return bytesToBase64Url(new Uint8Array(bits));
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
