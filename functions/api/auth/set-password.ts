import type { Env } from "../../env";
import { sessionCookieHeader } from "../../lib/cookies";
import { badRequest, unauthorized } from "../../lib/errors";
import { handleError, json, readJson, requireString } from "../../lib/http";
import { assertSameOrigin } from "../../lib/origin";
import {
  generateSecret,
  hashClientCredential,
  isClientHash,
  isSecretToken,
  sha256Hex,
} from "../../lib/password";
import {
  assertNotRateLimited,
  clientIp,
  rateLimitConfig,
  recordFailure,
} from "../../lib/ratelimit";
import { SESSION_MAX_AGE_SECONDS } from "../../lib/session";
import {
  audit,
  consumeToken,
  createSession,
  findAccountById,
  findToken,
  setAccountPassword,
  toPublicAccount,
} from "../../lib/store";

/**
 * POST /api/auth/set-password
 *
 * Sets the password from a one-time invitation token (the admin copies the link; the
 * token itself is 32 random bytes, only its SHA-256 is stored). Two steps, so the raw
 * password never reaches the server:
 *
 *   1. { token }            → { salt }   (validates the token first)
 *   2. { token, clientHash } → { account } + session cookie (auto-login)
 *
 * Step 2 consumes the token atomically (single-use, one-hour expiry) and activates
 * the account. Rate-limited per IP.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    assertSameOrigin(context.request);
    const body = await readJson(context.request);
    const token = requireString(body, "token");
    if (!isSecretToken(token)) {
      throw badRequest("invalid_token");
    }

    const config = rateLimitConfig(context.env);
    const ip = clientIp(context.request);
    const ipKey = `token:ip:${ip}` as const;
    await assertNotRateLimited(context.env.DB, ipKey, config.ipMaxAttempts, config.windowMs);

    const tokenHash = await sha256Hex(token);

    // Step 1: validate the token and hand out the account's salt.
    if (body.clientHash === undefined) {
      const row = await findToken(context.env.DB, tokenHash);
      if (!row || row.used_at !== null || Date.parse(row.expires_at) <= Date.now()) {
        await recordFailure(context.env.DB, ipKey, config.windowMs);
        throw unauthorized("invalid_token");
      }
      const account = await findAccountById(context.env.DB, row.account_id);
      if (!account) {
        throw unauthorized("invalid_token");
      }
      return json({ salt: account.salt });
    }

    // Step 2: consume the token and set the password.
    const clientHash = requireString(body, "clientHash");
    if (!isClientHash(clientHash)) {
      throw badRequest("bad_request");
    }
    const pepper = context.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new Error("PASSWORD_PEPPER is not configured");
    }
    const accountId = await consumeToken(context.env.DB, tokenHash);
    if (!accountId) {
      await recordFailure(context.env.DB, ipKey, config.windowMs);
      throw unauthorized("invalid_token");
    }
    const account = await findAccountById(context.env.DB, accountId);
    if (!account) {
      throw unauthorized("invalid_token");
    }
    const passwordHash = await hashClientCredential(clientHash, pepper);
    await setAccountPassword(context.env.DB, account.id, passwordHash);
    const activated = await findAccountById(context.env.DB, account.id);
    if (!activated) {
      throw unauthorized("invalid_token");
    }
    const session = await createSession(context.env.DB, {
      id: generateSecret(),
      accountId: account.id,
    });
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: account.id,
      action: "set_password",
      ip,
    });
    return json(
      { account: toPublicAccount(activated) },
      { headers: { "set-cookie": sessionCookieHeader(session.id, SESSION_MAX_AGE_SECONDS) } },
    );
  } catch (error) {
    return handleError(error, context.request);
  }
};
