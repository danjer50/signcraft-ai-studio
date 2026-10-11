/** Session timing (Milestone 5, security-reviewed design).
 *
 * - A session expires 7 days after issue, and activity renews it (sliding expiry):
 *   when less than a day remains, the expiry moves to now + 7 days.
 * - A hard cap of 30 days from creation bounds the sliding window: past it the
 *   session is deleted and the user signs in again.
 * - Logout, suspension and revocation delete the session row server-side, so a
 *   stolen cookie value stops working immediately.
 * - The cookie itself carries the same 7-day Max-Age; the database is authoritative.
 */
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_MAX_AGE_MS / 1000);
export const SESSION_HARD_CAP_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_RENEWAL_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function isoNow(): string {
  return new Date().toISOString();
}

export function isoFromMs(timestampMs: number): string {
  return new Date(timestampMs).toISOString();
}

export function parseIso(iso: string): number {
  return Date.parse(iso);
}
