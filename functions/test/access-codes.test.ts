// @vitest-environment node

import { pbkdf2Sync } from "node:crypto";
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it } from "vitest";

import type { Env } from "../env";
import { onRequestPost as login } from "../api/auth/login";
import { onRequestPost as prelogin } from "../api/auth/prelogin";
import { onRequestPost as setup } from "../api/auth/setup";
import {
  onRequestGet as listCodes,
  onRequestPost as createCode,
} from "../api/auth/access-codes/index";
import { onRequestPost as redeem } from "../api/auth/access-codes/redeem";
import { onRequestPost as revokeCode } from "../api/auth/access-codes/[id]/revoke";
import { onRequestGet as me } from "../api/auth/me";
import { onRequestGet as listAccounts } from "../api/auth/accounts/index";
import { SESSION_COOKIE } from "../lib/cookies";
import { resetRateLimitMemory } from "../lib/ratelimit";
import { createTestDatabase } from "./d1-adapter";

const schemaSql = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

const SETUP_SECRET = "test-setup-secret";
const PEPPER = "test-pepper";
const ADMIN_EMAIL = "admin@studio.test";
const ADMIN_PASSWORD = "admin-password-123";

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createTestDatabase(schemaSql),
    SETUP_SECRET,
    PASSWORD_PEPPER: PEPPER,
    AUTH_RATE_LIMIT_IP_MAX_ATTEMPTS: "500",
    ...overrides,
  };
}

function contextFor(
  request: Request,
  env: Env,
  params: Record<string, string> = {},
): EventContext<Env, string, Record<string, unknown>> {
  return {
    request,
    env,
    params,
    waitUntil: () => {},
    next: async () => new Response("not found", { status: 404 }),
  } as unknown as EventContext<Env, string, Record<string, unknown>>;
}

function post(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function get(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { method: "GET", headers });
}

function sessionIdFrom(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  return setCookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1] ?? "";
}

const adminCookie = (sessionId: string): Record<string, string> => ({
  cookie: `${SESSION_COOKIE}=${sessionId}`,
});

/** The browser-side pre-hash, computed with Node's crypto (as in src/lib/password.ts). */
function clientHashFor(password: string, saltHex: string): string {
  return pbkdf2Sync(
    Buffer.from(password.normalize("NFKC"), "utf8"),
    Buffer.from(saltHex, "hex"),
    600_000,
    32,
    "sha256",
  ).toString("base64url");
}

/** Creates the admin via setup, signs in, and returns the env plus the admin cookie. */
async function envWithAdmin(): Promise<{ env: Env; cookie: Record<string, string> }> {
  const env = makeEnv();
  const step1 = await setup(
    contextFor(post("https://studio.test/api/auth/setup", { setupSecret: SETUP_SECRET }), env),
  );
  expect(step1.status).toBe(200);
  const { salt } = (await step1.json()) as { salt: string };
  const step2 = await setup(
    contextFor(
      post("https://studio.test/api/auth/setup", {
        setupSecret: SETUP_SECRET,
        email: ADMIN_EMAIL,
        salt,
        clientHash: clientHashFor(ADMIN_PASSWORD, salt),
      }),
      env,
    ),
  );
  expect(step2.status).toBe(200);

  const pre = await prelogin(
    contextFor(post("https://studio.test/api/auth/prelogin", { email: ADMIN_EMAIL }), env),
  );
  const preSalt = ((await pre.json()) as { salt: string }).salt;
  const signed = await login(
    contextFor(
      post("https://studio.test/api/auth/login", {
        email: ADMIN_EMAIL,
        clientHash: clientHashFor(ADMIN_PASSWORD, preSalt),
      }),
      env,
    ),
  );
  expect(signed.status).toBe(200);
  return { env, cookie: adminCookie(sessionIdFrom(signed)) };
}

/** Admin helper: create a code and return its plaintext plus id. */
async function mint(
  env: Env,
  cookie: Record<string, string>,
  input: { label?: string; maxUses?: number; expiresInHours?: number } = {},
): Promise<{ id: string; code: string }> {
  const response = await createCode(
    contextFor(post("https://studio.test/api/auth/access-codes", input, cookie), env),
  );
  expect(response.status).toBe(201);
  return (await response.json()) as { id: string; code: string };
}

async function redeemCode(env: Env, code: string): Promise<Response> {
  return redeem(
    contextFor(post("https://studio.test/api/auth/access-codes/redeem", { code }), env),
  );
}

describe("Pro access codes", () => {
  beforeEach(() => {
    // The rate limiter keeps an in-memory window layer; clear it between tests.
    resetRateLimitMemory();
  });

  it("redeeming a valid code signs the visitor in as a pro account", async () => {
    const { env, cookie } = await envWithAdmin();
    const { code } = await mint(env, cookie, { label: "Salon Leila" });

    const response = await redeemCode(env, code);
    expect(response.status).toBe(200);
    const { account } = (await response.json()) as {
      account: { role: string; email: string; status: string };
    };
    // A code NEVER grants admin; the account is a lightweight passwordless pro.
    expect(account.role).toBe("pro");
    expect(account.status).toBe("active");

    const session = await me(
      contextFor(get("https://studio.test/api/auth/me", adminCookie(sessionIdFrom(response))), env),
    );
    expect(session.status).toBe(200);
    expect(((await session.json()) as { account: { role: string } }).account.role).toBe("pro");
  });

  it("codes created from a redemption cannot reach admin data", async () => {
    const { env, cookie } = await envWithAdmin();
    const { code } = await mint(env, cookie);
    const redeemed = await redeemCode(env, code);
    expect(redeemed.status).toBe(200);

    const accounts = await listAccounts(
      contextFor(
        get("https://studio.test/api/auth/accounts", adminCookie(sessionIdFrom(redeemed))),
        env,
      ),
    );
    expect(accounts.status).toBe(403);
  });

  it("unknown, malformed, exhausted, expired and revoked codes are rejected", async () => {
    const { env, cookie } = await envWithAdmin();

    expect((await redeemCode(env, "SC-AAAA-BBBB")).status).toBe(401); // unknown
    expect((await redeemCode(env, "nope")).status).toBe(400); // malformed

    // Single-use by default: the second redemption is refused.
    const single = await mint(env, cookie);
    expect((await redeemCode(env, single.code)).status).toBe(200);
    const again = await redeemCode(env, single.code);
    expect(again.status).toBe(401);
    expect(((await again.json()) as { error: { code: string } }).error.code).toBe("code_exhausted");

    // Expired: the admin mints a 1-hour code, then time is moved past it in the DB.
    const expiring = await mint(env, cookie, { expiresInHours: 1 });
    await env.DB.prepare("UPDATE access_codes SET expires_at = ? WHERE id = ?")
      .bind(new Date(Date.now() - 1000).toISOString(), expiring.id)
      .run();
    const expired = await redeemCode(env, expiring.code);
    expect(expired.status).toBe(401);
    expect(((await expired.json()) as { error: { code: string } }).error.code).toBe("code_expired");

    // Revoked: refused after revocation even with uses left.
    const revocable = await mint(env, cookie, { maxUses: 5 });
    const revoke = await revokeCode(
      contextFor(
        post(`https://studio.test/api/auth/access-codes/${revocable.id}/revoke`, {}, cookie),
        env,
        {
          id: revocable.id,
        },
      ),
    );
    expect(revoke.status).toBe(200);
    const afterRevoke = await redeemCode(env, revocable.code);
    expect(afterRevoke.status).toBe(401);
    expect(((await afterRevoke.json()) as { error: { code: string } }).error.code).toBe(
      "code_revoked",
    );
  });

  it("multi-use codes allow exactly maxUses redemptions", async () => {
    const { env, cookie } = await envWithAdmin();
    const { code } = await mint(env, cookie, { maxUses: 3 });
    for (let i = 0; i < 3; i += 1) {
      expect((await redeemCode(env, code)).status).toBe(200);
    }
    expect((await redeemCode(env, code)).status).toBe(401);
  });

  it("two simultaneous redemptions of the last remaining use: exactly one wins", async () => {
    const { env, cookie } = await envWithAdmin();
    const { code } = await mint(env, cookie, { maxUses: 1 });
    const [a, b] = await Promise.all([redeemCode(env, code), redeemCode(env, code)]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 401]);
  });

  it("revoking a code kills the sessions of the accounts it created", async () => {
    const { env, cookie } = await envWithAdmin();
    const { id, code } = await mint(env, cookie, { maxUses: 2 });
    const redeemed = await redeemCode(env, code);
    expect(redeemed.status).toBe(200);
    const visitorCookie = adminCookie(sessionIdFrom(redeemed));

    // While the code lives, the session works…
    const meBefore = await me(
      contextFor(get("https://studio.test/api/auth/me", visitorCookie), env),
    );
    expect(((await meBefore.json()) as { authenticated: boolean }).authenticated).toBe(true);

    const revoke = await revokeCode(
      contextFor(post(`https://studio.test/api/auth/access-codes/${id}/revoke`, {}, cookie), env, {
        id,
      }),
    );
    expect(revoke.status).toBe(200);
    // …and the revocation signs the visitor out immediately (/me reports anonymous).
    const meAfter = await me(
      contextFor(get("https://studio.test/api/auth/me", visitorCookie), env),
    );
    expect(meAfter.status).toBe(200);
    expect(((await meAfter.json()) as { authenticated: boolean }).authenticated).toBe(false);
  });

  it("only admins can create, list or revoke codes; plaintext is never listed", async () => {
    const { env, cookie } = await envWithAdmin();
    const { id, code } = await mint(env, cookie, { label: "Shop" });

    const listed = await listCodes(
      contextFor(get("https://studio.test/api/auth/access-codes", cookie), env),
    );
    expect(listed.status).toBe(200);
    const { codes } = (await listed.json()) as {
      codes: { id: string; label: string; state: string; uses: number }[];
    };
    expect(codes).toHaveLength(1);
    expect(codes[0]).toMatchObject({ id, label: "Shop", state: "active", uses: 0 });
    // The plaintext appears once at creation and is never stored or returned.
    expect(listed.headers.get("content-type")).not.toBeNull();
    const body = JSON.stringify(codes);
    expect(body).not.toContain(code);

    // Anonymous: no admin data, no redemption management.
    const anonymous = await listCodes(
      contextFor(get("https://studio.test/api/auth/access-codes"), env),
    );
    expect(anonymous.status).toBe(401);
  });

  it("code guessing is rate-limited per IP", async () => {
    const { env, cookie } = await envWithAdmin();
    const strict: Env = { ...env, AUTH_RATE_LIMIT_IP_MAX_ATTEMPTS: "3" };
    for (let i = 0; i < 3; i += 1) {
      expect((await redeemCode(strict, "SC-ZZZZ-ZZZZ")).status).toBe(401);
    }
    expect((await redeemCode(strict, "SC-ZZZZ-ZZZZ")).status).toBe(429);
    // The minted code is untouched by the limit bookkeeping but the IP is locked out.
    const { code } = await mint(env, cookie);
    expect((await redeemCode(strict, code)).status).toBe(429);
  });
});
