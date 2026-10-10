import type { Env } from "../../env";
import { SESSION_COOKIE, clearSessionCookieHeader, parseCookies } from "../../lib/cookies";
import { handleError, json } from "../../lib/http";
import { assertSameOrigin } from "../../lib/origin";
import { clientIp } from "../../lib/ratelimit";
import { audit, deleteSession, findSession } from "../../lib/store";

/**
 * POST /api/auth/logout
 *
 * Deletes the session server-side and clears the cookie. Idempotent: logging out
 * without a session still succeeds, so the client can always call it.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    assertSameOrigin(context.request);
    const sessionId = parseCookies(context.request).get(SESSION_COOKIE);
    let actorAccountId: string | undefined;
    if (sessionId) {
      const session = await findSession(context.env.DB, sessionId);
      if (session) {
        actorAccountId = session.account_id;
        await deleteSession(context.env.DB, session.id);
      }
    }
    if (actorAccountId) {
      await audit(context.env.DB, {
        id: crypto.randomUUID(),
        actorAccountId,
        action: "logout",
        ip: clientIp(context.request),
      });
    }
    return json({ ok: true }, { headers: { "set-cookie": clearSessionCookieHeader() } });
  } catch (error) {
    return handleError(error, context.request);
  }
};
