import type { Env } from "../../env";
import { sessionCookieHeader } from "../../lib/cookies";
import { badRequest, forbidden, unauthorized } from "../../lib/errors";
import { handleError, json, readJson, requireString } from "../../lib/http";
import { assertSameOrigin } from "../../lib/origin";
import {
  DUMMY_HASH,
  generateSecret,
  isClientHash,
  verifyClientCredential,
} from "../../lib/password";
import {
  assertNotRateLimited,
  clearRateLimits,
  clientIp,
  rateLimitConfig,
  recordFailure,
  type RateLimitKey,
} from "../../lib/ratelimit";
import { SESSION_MAX_AGE_SECONDS } from "../../lib/session";
import {
  audit,
  createSession,
  findAccountByEmail,
  isValidEmail,
  normalizeEmail,
  toPublicAccount,
  touchLastLogin,
} from "../../lib/store";

/**
 * POST /api/auth/login { email, clientHash }
 *
 * The client hash is base64url(PBKDF2-SHA256(password, salt, 600000)) — the raw
 * password never reaches the server. Verification is a timing-safe compare of
 * sha256hex(clientHash + pepper) with the stored hash. Unknown emails get a dummy
 * compare, so failures take the same path whether or not the account exists.
 * Failures are rate-limited per IP and per email; a success clears both keys and
 * creates a session (`__Host-` cookie, 7-day sliding expiry, 30-day hard cap).
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    assertSameOrigin(context.request);
    const body = await readJson(context.request);
    const email = normalizeEmail(requireString(body, "email"));
    const clientHash = requireString(body, "clientHash");
    if (!isValidEmail(email)) {
      throw badRequest("invalid_email");
    }
    if (!isClientHash(clientHash)) {
      throw badRequest("bad_request");
    }

    const config = rateLimitConfig(context.env);
    const ip = clientIp(context.request);
    const ipKey: RateLimitKey = `login:ip:${ip}`;
    const emailKey: RateLimitKey = `login:email:${await hashEmail(email)}`;
    await assertNotRateLimited(context.env.DB, ipKey, config.ipMaxAttempts, config.windowMs);
    await assertNotRateLimited(context.env.DB, emailKey, config.maxAttempts, config.windowMs);

    const pepper = context.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new Error("PASSWORD_PEPPER is not configured");
    }
    const account = await findAccountByEmail(context.env.DB, email);

    if (!account || !account.password_hash) {
      // Unknown email (or no password yet): do the same dummy compare so the
      // failure path takes the same time whether or not the account exists.
      await verifyClientCredential(clientHash, pepper, DUMMY_HASH);
      await recordFailure(context.env.DB, ipKey, config.windowMs);
      await recordFailure(context.env.DB, emailKey, config.windowMs);
      await audit(context.env.DB, {
        id: crypto.randomUUID(),
        action: "login_failure",
        detail: `email=${email}`,
        ip,
      });
      throw unauthorized("invalid_credentials");
    }

    const valid = await verifyClientCredential(clientHash, pepper, account.password_hash);
    if (!valid) {
      await recordFailure(context.env.DB, ipKey, config.windowMs);
      await recordFailure(context.env.DB, emailKey, config.windowMs);
      await audit(context.env.DB, {
        id: crypto.randomUUID(),
        actorAccountId: account.id,
        action: "login_failure",
        ip,
      });
      throw unauthorized("invalid_credentials");
    }

    // The password is correct; only now may the account status speak.
    if (account.status === "suspended") {
      await audit(context.env.DB, {
        id: crypto.randomUUID(),
        actorAccountId: account.id,
        action: "login_blocked",
        detail: "suspended",
        ip,
      });
      throw forbidden("account_suspended");
    }
    if (account.status === "revoked") {
      await audit(context.env.DB, {
        id: crypto.randomUUID(),
        actorAccountId: account.id,
        action: "login_blocked",
        detail: "revoked",
        ip,
      });
      throw forbidden("account_revoked");
    }

    await clearRateLimits(context.env.DB, [ipKey, emailKey]);
    await touchLastLogin(context.env.DB, account.id);
    const session = await createSession(context.env.DB, {
      id: generateSecret(),
      accountId: account.id,
    });
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: account.id,
      action: "login_success",
      ip,
    });

    return json(
      { account: toPublicAccount(account) },
      {
        headers: {
          "set-cookie": sessionCookieHeader(session.id, SESSION_MAX_AGE_SECONDS),
        },
      },
    );
  } catch (error) {
    return handleError(error, context.request);
  }
};

async function hashEmail(email: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
