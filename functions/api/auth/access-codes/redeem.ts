import type { Env } from "../../../env";
import { hashCode, normalizeAccessCode } from "../../../lib/access-codes";
import { sessionCookieHeader } from "../../../lib/cookies";
import { badRequest, unauthorized } from "../../../lib/errors";
import { handleError, json, readJson, requireString } from "../../../lib/http";
import { assertSameOrigin } from "../../../lib/origin";
import { generateSalt, generateSecret } from "../../../lib/password";
import {
  assertNotRateLimited,
  clientIp,
  rateLimitConfig,
  recordFailure,
  type RateLimitKey,
} from "../../../lib/ratelimit";
import { SESSION_MAX_AGE_SECONDS } from "../../../lib/session";
import { audit, createAccount, createSession, toPublicAccount } from "../../../lib/store";

interface AccessCodeRow {
  id: string;
  code_hash: string;
  label: string | null;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
}

/**
 * POST /api/auth/access-codes/redeem { code }
 *
 * The ONLY customer-facing entry to the Pro workspace. A valid, unrevoked,
 * unexpired, non-exhausted code creates a lightweight account (role "pro", no
 * password — codes never grant admin, never touch passwords) and opens a session,
 * exactly like a password login.
 *
 * Concurrency: the use is claimed with an atomic
 *   UPDATE access_codes SET uses = uses + 1 WHERE id = ? AND revoked_at IS NULL
 *     AND uses < max_uses AND (expires_at IS NULL OR expires_at > ?)
 * so two simultaneous redemptions of the last remaining use cannot both succeed.
 * Guessing is rate-limited per IP (same window/limits as password login).
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    assertSameOrigin(context.request);
    const body = await readJson(context.request);
    const raw = requireString(body, "code");
    const code = normalizeAccessCode(raw);
    if (!code) {
      throw badRequest("invalid_code");
    }

    const config = rateLimitConfig(context.env);
    const ip = clientIp(context.request);
    const ipKey: RateLimitKey = `code:ip:${ip}`;
    await assertNotRateLimited(context.env.DB, ipKey, config.ipMaxAttempts, config.windowMs);

    const pepper = context.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new Error("PASSWORD_PEPPER is not configured");
    }
    const now = new Date().toISOString();

    const codeRow = await context.env.DB.prepare("SELECT * FROM access_codes WHERE code_hash = ?")
      .bind(await hashCode(code, pepper))
      .first<AccessCodeRow>();

    if (!codeRow) {
      await recordFailure(context.env.DB, ipKey, config.windowMs);
      await audit(context.env.DB, {
        id: crypto.randomUUID(),
        action: "code_redeem_failure",
        detail: "unknown",
        ip,
      });
      throw unauthorized("invalid_code");
    }

    // Claim one use atomically; 0 changed rows means someone got there first or the
    // code no longer qualifies. Distinguish the reason only AFTER a real match.
    const claimed = await context.env.DB.prepare(
      "UPDATE access_codes SET uses = uses + 1 WHERE id = ? AND revoked_at IS NULL " +
        "AND uses < max_uses AND (expires_at IS NULL OR expires_at > ?)",
    )
      .bind(codeRow.id, now)
      .run();
    if (!claimed.meta.changes) {
      await recordFailure(context.env.DB, ipKey, config.windowMs);
      const reason =
        codeRow.revoked_at !== null
          ? "code_revoked"
          : codeRow.expires_at !== null && codeRow.expires_at <= now
            ? "code_expired"
            : "code_exhausted";
      await audit(context.env.DB, {
        id: crypto.randomUUID(),
        action: "code_redeem_failure",
        detail: reason,
        ip,
      });
      throw unauthorized(reason);
    }

    // Lightweight pro account: no password (login stays password-based; codes are
    // a separate, revocable door). The email is synthetic and unique per code row.
    const accountId = crypto.randomUUID();
    const email = `pro-${accountId.slice(0, 8)}-${codeRow.id.slice(0, 8)}@access.signcraft.local`;
    await createAccount(context.env.DB, {
      id: accountId,
      email,
      role: "pro",
      status: "active",
      salt: generateSalt(),
      passwordHash: null,
    });

    await context.env.DB.prepare(
      "INSERT INTO code_usages (id, code_id, account_id, ip, used_at) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(crypto.randomUUID(), codeRow.id, accountId, ip, now)
      .run();

    const session = await createSession(context.env.DB, {
      id: generateSecret(),
      accountId,
    });
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: accountId,
      action: "code_redeemed",
      detail: `code=${codeRow.id}`,
      ip,
    });

    const account = await context.env.DB.prepare("SELECT * FROM accounts WHERE id = ?")
      .bind(accountId)
      .first<Parameters<typeof toPublicAccount>[0]>();
    if (!account) {
      throw new Error("the redeemed account could not be loaded");
    }

    return json(
      { account: toPublicAccount(account) },
      { headers: { "set-cookie": sessionCookieHeader(session.id, SESSION_MAX_AGE_SECONDS) } },
    );
  } catch (error) {
    return handleError(error, context.request);
  }
};
