import type { Env } from "../../../../env";
import { requireRole, routeParam } from "../../../../lib/guard";
import { handleError, json } from "../../../../lib/http";
import { assertSameOrigin } from "../../../../lib/origin";
import { conflict, notFound } from "../../../../lib/errors";
import { clientIp } from "../../../../lib/ratelimit";
import { audit, findAccountById, setAccountStatus } from "../../../../lib/store";

/**
 * POST /api/auth/accounts/:id/restore — admin only.
 *
 * Restores a suspended professional account to active. The password is unchanged,
 * so the professional signs in with the password they already had.
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
    if (target.status !== "suspended") {
      throw conflict("not_suspended");
    }
    await setAccountStatus(context.env.DB, target.id, "active");
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: auth.account.id,
      action: "restore",
      targetAccountId: target.id,
      ip: clientIp(context.request),
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error, context.request);
  }
};
