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
 * POST /api/auth/accounts/:id/suspend — admin only.
 *
 * Suspends a professional account: the status changes, and every session and token
 * of the account is deleted server-side, so a signed-in professional is logged out
 * immediately and invitation links stop working. An admin cannot suspend themselves
 * or another admin.
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
      throw badRequest("cannot_suspend_self");
    }
    if (target.role === "admin") {
      throw badRequest("cannot_suspend_admin");
    }
    await setAccountStatus(context.env.DB, target.id, "suspended");
    await deleteSessionsForAccount(context.env.DB, target.id);
    await deleteTokensForAccount(context.env.DB, target.id);
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: auth.account.id,
      action: "suspend",
      targetAccountId: target.id,
      ip: clientIp(context.request),
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, context.request);
  }
};
