import type { Env } from "../../../env";
import { generateAccessCode, hashCode } from "../../../lib/access-codes";
import { badRequest } from "../../../lib/errors";
import { requireRole } from "../../../lib/guard";
import { handleError, json, readJson } from "../../../lib/http";
import { assertSameOrigin } from "../../../lib/origin";
import { clientIp } from "../../../lib/ratelimit";
import { audit } from "../../../lib/store";

export interface AccessCodeSummary {
  id: string;
  label: string | null;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  /** Derived at read time; the plaintext code itself is never stored or returned. */
  state: "active" | "expired" | "revoked" | "exhausted";
}

/**
 * /api/auth/access-codes — admin only.
 *
 * GET  → the code list (hashes excluded; the plaintext is never retrievable).
 * POST { label?, maxUses?, expiresInHours? } → creates a code and returns its
 *   plaintext EXACTLY ONCE. maxUses is clamped to 1..100 (multi-use is supported);
 *   expiresInHours is optional (1..8760). Codes can never grant admin — redemption
 *   always creates role "pro".
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireRole(context, "admin");
    const now = new Date().toISOString();
    const { results } = await context.env.DB.prepare(
      "SELECT id, label, max_uses, uses, expires_at, revoked_at, created_at " +
        "FROM access_codes ORDER BY created_at DESC LIMIT 200",
    ).all<Omit<AccessCodeSummary, "state">>();
    const codes: AccessCodeSummary[] = (results ?? []).map((row) => ({
      ...row,
      state:
        row.revoked_at !== null
          ? "revoked"
          : row.expires_at !== null && row.expires_at <= now
            ? "expired"
            : row.uses >= row.max_uses
              ? "exhausted"
              : "active",
    }));
    return json({ codes });
  } catch (error) {
    return handleError(error, context.request);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    assertSameOrigin(context.request);
    const auth = await requireRole(context, "admin");
    const body = await readJson(context.request);
    const label =
      typeof body.label === "string" && body.label.trim() !== ""
        ? body.label.trim().slice(0, 80)
        : null;
    const maxUses = body.maxUses === undefined ? 1 : Math.trunc(Number(body.maxUses));
    if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 100) {
      throw badRequest("bad_request");
    }
    let expiresAt: string | null = null;
    if (body.expiresInHours !== undefined) {
      const hours = Math.trunc(Number(body.expiresInHours));
      if (!Number.isFinite(hours) || hours < 1 || hours > 8760) {
        throw badRequest("bad_request");
      }
      expiresAt = new Date(Date.now() + hours * 3600_000).toISOString();
    }

    const pepper = context.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new Error("PASSWORD_PEPPER is not configured");
    }

    const id = crypto.randomUUID();
    const code = generateAccessCode();
    await context.env.DB.prepare(
      "INSERT INTO access_codes (id, code_hash, label, max_uses, uses, expires_at, revoked_at, created_by, created_at) " +
        "VALUES (?, ?, ?, ?, 0, ?, NULL, ?, ?)",
    )
      .bind(
        id,
        await hashCode(code, pepper),
        label,
        maxUses,
        expiresAt,
        auth.account.id,
        new Date().toISOString(),
      )
      .run();
    await audit(context.env.DB, {
      id: crypto.randomUUID(),
      actorAccountId: auth.account.id,
      action: "code_created",
      detail: `code=${id} maxUses=${maxUses}`,
      ip: clientIp(context.request),
    });

    // The plaintext appears in exactly one response and is never stored.
    return json({ id, code, label, maxUses, expiresAt }, { status: 201 });
  } catch (error) {
    return handleError(error, context.request);
  }
};
