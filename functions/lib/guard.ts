import type { Env } from "../env";

import { SESSION_COOKIE, parseCookies } from "./cookies";
import { forbidden, notFound, unauthorized } from "./errors";
import { SESSION_RENEWAL_THRESHOLD_MS, SESSION_MAX_AGE_MS, parseIso } from "./session";
import {
  deleteSession,
  findAccountById,
  findSession,
  renewSession,
  type AccountRole,
  type AccountRow,
  type SessionRow,
} from "./store";

/**
 * Session guard: resolves the session cookie to an active account, renewing the
 * sliding expiry when it is close to lapsing. Returns null when there is no valid
 * session (no cookie, unknown id, expired, past the hard cap, or the account is not
 * active). Invalid sessions are deleted server-side.
 */
export interface AuthContext {
  account: AccountRow;
  session: SessionRow;
}

export async function requireSession(
  context: EventContext<Env, string, unknown>,
): Promise<AuthContext | null> {
  const sessionId = parseCookies(context.request).get(SESSION_COOKIE);
  if (!sessionId) {
    return null;
  }
  const db = context.env.DB;
  const session = await findSession(db, sessionId);
  if (!session) {
    return null;
  }
  const nowMs = Date.now();
  const hardCapMs = parseIso(session.hard_expires_at);
  const expiresMs = parseIso(session.expires_at);
  if (expiresMs <= nowMs || hardCapMs <= nowMs) {
    await deleteSession(db, session.id);
    return null;
  }
  // Sliding renewal: extend when less than a day remains, capped by the hard cap.
  if (expiresMs - nowMs <= SESSION_RENEWAL_THRESHOLD_MS) {
    const renewed = Math.min(nowMs + SESSION_MAX_AGE_MS, hardCapMs);
    await renewSession(db, session.id, new Date(renewed).toISOString());
  }
  const account = await findAccountById(db, session.account_id);
  if (!account || account.status !== "active") {
    // Suspended or revoked accounts lose their sessions immediately.
    await deleteSession(db, session.id);
    return null;
  }
  return { account, session };
}

/** Requires an authenticated account with the given role (server-enforced). */
export async function requireRole(
  context: EventContext<Env, string, unknown>,
  role: AccountRole,
): Promise<AuthContext> {
  const auth = await requireSession(context);
  if (!auth) {
    // No valid session: 401, not 403, so clients redirect to the login page.
    throw unauthorized("unauthorized");
  }
  if (auth.account.role !== role) {
    throw forbidden("insufficient_role");
  }
  return auth;
}

/** Reads a single route parameter, e.g. the account id in /api/auth/accounts/[id]/. */
export function routeParam(context: EventContext<Env, string, unknown>, name: string): string {
  const value = context.params[name];
  if (typeof value !== "string" || value === "") {
    throw notFound("not_found");
  }
  return value;
}
