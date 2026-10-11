/**
 * The session cookie. The `__Host-` prefix (security-review amendment) requires
 * Secure, Path=/ and no Domain attribute — all set below.
 */
export const SESSION_COOKIE = "__Host-sc_session";

export function parseCookies(request: Request): Map<string, string> {
  const map = new Map<string, string>();
  const header = request.headers.get("cookie");
  if (!header) {
    return map;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) {
      map.set(name, value);
    }
  }
  return map;
}

export function sessionCookieHeader(sessionId: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
