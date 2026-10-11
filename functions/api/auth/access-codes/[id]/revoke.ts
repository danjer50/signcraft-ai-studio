import type { Env } from "../../../../env";
import { requireRole, routeParam } from "../../../../lib/guard";
import { handleError, json } from "../../../../lib/http";
import { assertSameOrigin } from "../../../../lib/origin";
import { notFound } from "../../../../lib/errors";
import { clientIp } from "../../../../lib/ratelimit";
import { audit, deleteSessionsForAccount } from "../../../../lib/store";

/**
 * POST /api/auth/access-codes/[id]/revoke — admin only.
 *
 * Revoking a code immediately: stops future redemptions, and kills the sessions of
 * every account that was created from this code (recorded in code_usages), so a
 * leaked code can be cut off at once. Password-based accounts are never touched.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    assertSameOrigin(context.request);
    const auth = await requireRole(context, "admin");
    const id = routeParam(context, "id");

    const existing = await context.env.DB.prepare("SELECT id FROM access_codes WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();
    if (!existing) {
      throw notFound("not_found");
    }

    const now = new Date().toISOString();
    await context.env.DB.prepare(
      "UPDATE access_codes SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
    )
      .bind(now, id)
      .run();

    // Sign out everyone who entered through this code.
    const { results } = await context.env.DB.prepare(
      "SELECT account_id FROM code_usages WHERE code_id = ? AND account_id IS NOT NULL",
    )
      .bind(id)
      .all<{ account_id: string }>();
    for (const usage of results ?? []) {
      await deleteSessionsForAccount(context.env.DB, usage.account_id);
    }

    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: auth.account.id,
      action: "code_revoked",
      detail: `code=${id} sessionsKilled=${(results ?? []).length}`,
      ip: clientIp(context.request),
    });

    return json({ revoked: true });
  } catch (error) {
    return handleError(error, context.request);
  }
};
