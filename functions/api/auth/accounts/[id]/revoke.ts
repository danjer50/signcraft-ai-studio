import type { Env } from "../../../../env";
import { requireRole, routeParam } from "../../../../lib/guard";
import { handleError, json } from "../../../../lib/http";
import { assertSameOrigin } from "../../../../lib/origin";
import { badRequest, notFound } from "../../../../lib/errors";
import { clientIp } from "../../../../lib/ratelimit";
import {
  audit,
  deleteSessionsForAccount,
  deleteTokensForAccount,
  findAccountById,
  setAccountStatus,
} from "../../../../lib/store";

/**
 * POST /api/auth/accounts/:id/revoke — admin only.
 *
 * Revokes a professional account: the status becomes "revoked", all sessions and
 * tokens are deleted server-side, and login is refused with a specific error. The
 * account row is kept for the audit trail. An admin cannot revoke themselves or
 * another admin.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const auth = await requireRole(context, "admin");
    assertSameOrigin(context.request);
    const targetId = routeParam(context, "id");
    const target = await findAccountById(context.env.DB, targetId);
    if (!target) {
      throw notFound("account_not_found");
    }
    if (target.id === auth.account.id) {
      throw badRequest("cannot_revoke_self");
    }
    if (target.role === "admin") {
      throw badRequest("cannot_revoke_admin");
    }
    await setAccountStatus(context.env.DB, target.id, "revoked");
    await deleteSessionsForAccount(context.env.DB, target.id);
    await deleteTokensForAccount(context.env.DB, target.id);
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: auth.account.id,
      action: "revoke",
      targetAccountId: target.id,
      ip: clientIp(context.request),
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, context.request);
  }
};
