import type { Env } from "../../env";
import { badRequest, conflict, unauthorized } from "../../lib/errors";
import { handleError, json, readJson, requireString } from "../../lib/http";
import { assertSameOrigin } from "../../lib/origin";
import {
  generateSalt,
  hashClientCredential,
  isClientHash,
  isSalt,
  verifySecretAsync,
} from "../../lib/password";
import {
  assertNotRateLimited,
  clientIp,
  rateLimitConfig,
  recordFailure,
} from "../../lib/ratelimit";
import { audit, createFirstAdminIfNone, isValidEmail, normalizeEmail } from "../../lib/store";

/**
 * POST /api/auth/setup
 *
 * One-time, unlinked initial admin setup, gated by the SETUP_SECRET secret
 * (constant-time compare). Two steps, so the raw password never reaches the server:
 *
 *   1. { setupSecret }                      → { salt }
 *   2. { setupSecret, email, salt, clientHash } → { ok: true, account }
 *
 * Step 2 inserts the first admin atomically (INSERT … WHERE NOT EXISTS) and refuses
 * with 409 once an admin exists. Rate-limited per IP. Local tests pre-seed an admin,
 * so this endpoint answers 409 there; the success path is covered by unit tests.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    assertSameOrigin(context.request);
    const body = await readJson(context.request);
    const setupSecret = requireString(body, "setupSecret");

    const config = rateLimitConfig(context.env);
    const ip = clientIp(context.request);
    await assertNotRateLimited(
      context.env.DB,
      `setup:ip:${ip}`,
      config.ipMaxAttempts,
      config.windowMs,
    );

    const configuredSecret = context.env.SETUP_SECRET;
    if (!configuredSecret || !(await verifySecretAsync(setupSecret, configuredSecret))) {
      await recordFailure(context.env.DB, `setup:ip:${ip}`, config.windowMs);
      throw unauthorized("invalid_setup_secret");
    }

    // Step 1: hand out a salt for the browser-side PBKDF2 pre-hash.
    if (body.email === undefined && body.clientHash === undefined) {
      return json({ salt: generateSalt() });
    }

    // Step 2: create the first admin.
    const email = normalizeEmail(requireString(body, "email"));
    const salt = requireString(body, "salt");
    const clientHash = requireString(body, "clientHash");
    if (!isValidEmail(email)) {
      throw badRequest("invalid_email");
    }
    if (!isSalt(salt)) {
      throw badRequest("bad_request");
    }
    if (!isClientHash(clientHash)) {
      throw badRequest("bad_request");
    }

    const pepper = context.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new Error("PASSWORD_PEPPER is not configured");
    }
    const passwordHash = await hashClientCredential(clientHash, pepper);
    const created = await createFirstAdminIfNone(context.env.DB, {
      id: crypto.randomUUID(),
      email,
      role: "admin",
      status: "active",
      salt,
      passwordHash,
    });
    if (!created) {
      throw conflict("admin_already_exists");
    }
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      action: "setup_completed",
      detail: `email=${email}`,
      ip,
    });
    return json({ ok: true, account: { email, role: "admin" } });
  } catch (error) {
    return handleError(error, context.request);
  }
};
