import type { Env } from "../../env";
import { badRequest } from "../../lib/errors";
import { handleError, json, readJson, requireString } from "../../lib/http";
import { DUMMY_SALT } from "../../lib/password";
import {
  assertNotRateLimited,
  clientIp,
  rateLimitConfig,
  type RateLimitKey,
} from "../../lib/ratelimit";
import { findAccountByEmail, isValidEmail, normalizeEmail } from "../../lib/store";

/**
 * POST /api/auth/prelogin { email }
 *
 * First step of the login flow: returns the account's PBKDF2 salt so the browser can
 * derive the client hash. Unknown emails get a fixed dummy salt, so the response
 * shape (and the client's work) does not reveal whether the account exists.
 * Rate-limited per IP and per email.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await readJson(context.request);
    const email = normalizeEmail(requireString(body, "email"));
    if (!isValidEmail(email)) {
      throw badRequest("invalid_email");
    }
    const config = rateLimitConfig(context.env);
    const ip = clientIp(context.request);
    await assertNotRateLimited(
      context.env.DB,
      `login:ip:${ip}`,
      config.ipMaxAttempts,
      config.windowMs,
    );
    const emailKey: RateLimitKey = `login:email:${await hashKey(email)}`;
    await assertNotRateLimited(context.env.DB, emailKey, config.maxAttempts, config.windowMs);

    const account = await findAccountByEmail(context.env.DB, email);
    return json({ salt: account?.salt ?? DUMMY_SALT });
  } catch (error) {
    return handleError(error, context.request);
  }
};

async function hashKey(email: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
