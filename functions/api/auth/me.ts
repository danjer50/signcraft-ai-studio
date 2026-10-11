import type { Env } from "../../env";
import { handleError, json } from "../../lib/http";
import { requireSession } from "../../lib/guard";
import { toPublicAccount } from "../../lib/store";

/**
 * GET /api/auth/me
 *
 * The session probe used by the navigation and the gated pages. Always 200: the body
 * says whether the caller is authenticated. Never cached (no-store).
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const auth = await requireSession(context);
    if (!auth) {
      return json({ authenticated: false });
    }
    return json({ authenticated: true, account: toPublicAccount(auth.account) });
  } catch (error) {
    return handleError(error, context.request);
  }
};
