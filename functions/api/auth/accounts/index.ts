import type { Env } from "../../../env";
import { requireRole } from "../../../lib/guard";
import { handleError, json, readJson, requireString } from "../../../lib/http";
import { assertSameOrigin } from "../../../lib/origin";
import { badRequest, conflict } from "../../../lib/errors";
import { generateSalt, generateSecret, sha256Hex } from "../../../lib/password";
import { clientIp } from "../../../lib/ratelimit";
import {
  audit,
  createAccount,
  createToken,
  findAccountByEmail,
  isValidEmail,
  listAccounts,
  normalizeEmail,
  toPublicAccount,
  type AccountRole,
} from "../../../lib/store";

/** Invitation tokens expire one hour after they are created. */
const TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * /api/auth/accounts — admin only.
 *
 * GET  → the account list (never includes salts or password hashes).
 * POST { email } → invites a professional: creates an invited account (no password
 *   yet) and a one-time set-password token. The admin copies the invitation link;
 *   there is no email service. Only role "pro" can be invited — admin accounts are
 *   not created through the API.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireRole(context, "admin");
    const accounts = await listAccounts(context.env.DB);
    return json({ accounts: accounts.map(toPublicAccount) });
  } catch (error) {
    return handleError(error, context.request);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const auth = await requireRole(context, "admin");
    assertSameOrigin(context.request);
    const body = await readJson(context.request);
    const email = normalizeEmail(requireString(body, "email"));
    if (!isValidEmail(email)) {
      throw badRequest("invalid_email");
    }
    const role = (body.role ?? "pro") as AccountRole;
    if (role !== "pro") {
      // Admins are never created through the API; see docs/ARCHITECTURE.md.
      throw badRequest("invalid_role");
    }
    if (await findAccountByEmail(context.env.DB, email)) {
      throw conflict("account_exists");
    }

    const accountId = crypto.randomUUID();
    await createAccount(context.env.DB, {
      id: accountId,
      email,
      role,
      status: "invited",
      salt: generateSalt(),
      passwordHash: null,
    });
    const token = generateSecret();
    await createToken(context.env.DB, {
      tokenHash: await sha256Hex(token),
      accountId,
      purpose: "set-password",
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    });
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: auth.account.id,
      action: "invite",
      targetAccountId: accountId,
      detail: `email=${email} role=${role}`,
      ip: clientIp(context.request),
    });
    return json({ inviteToken: token }, { status: 201 });
  } catch (error) {
    return handleError(error, context.request);
  }
};
