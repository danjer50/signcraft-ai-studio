// @vitest-environment node

import { pbkdf2Sync } from "node:crypto";
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it } from "vitest";

import type { Env } from "../env";
import { onRequestGet as listAccounts, onRequestPost as invite } from "../api/auth/accounts/index";
import { onRequestPost as restore } from "../api/auth/accounts/[id]/restore";
import { onRequestPost as revoke } from "../api/auth/accounts/[id]/revoke";
import { onRequestPost as suspend } from "../api/auth/accounts/[id]/suspend";
import { onRequestPost as login } from "../api/auth/login";
import { onRequestGet as me } from "../api/auth/me";
import { onRequestPost as prelogin } from "../api/auth/prelogin";
import { onRequestPost as setPassword } from "../api/auth/set-password";
import { onRequestPost as setup } from "../api/auth/setup";
import { onRequestPost as logout } from "../api/auth/logout";
import { SESSION_COOKIE } from "../lib/cookies";
import { resetRateLimitMemory } from "../lib/ratelimit";
import { createTestDatabase } from "./d1-adapter";

const schemaSql = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

const SETUP_SECRET = "test-setup-secret";
const PEPPER = "test-pepper";
const ADMIN_EMAIL = "admin@studio.test";
const ADMIN_PASSWORD = "admin-password-123";
const PRO_EMAIL = "pro@studio.test";
const PRO_PASSWORD = "pro-password-456";

/** The browser-side pre-hash, computed with Node's crypto (same algorithm as src/lib/password.ts). */
function clientHashFor(password: string, saltHex: string): string {
  return pbkdf2Sync(
    Buffer.from(password.normalize("NFKC"), "utf8"),
    Buffer.from(saltHex, "hex"),
    600_000,
    32,
    "sha256",
  ).toString("base64url");
}

function makeEnv(): Env {
  return {
    DB: createTestDatabase(schemaSql),
    SETUP_SECRET,
    PASSWORD_PEPPER: PEPPER,
    // Tests share one "IP"; keep the IP limit high so per-email keys are what trips.
    AUTH_RATE_LIMIT_IP_MAX_ATTEMPTS: "500",
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

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function sessionIdFrom(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? "";
}

function cookieHeader(sessionId: string): Record<string, string> {
  return { cookie: `${SESSION_COOKIE}=${sessionId}` };
}

/** Runs the two-step setup and returns the env with the admin account created. */
async function envWithAdmin(): Promise<Env> {
  const env = makeEnv();
  const step1 = await setup(
    contextFor(post("https://studio.test/api/auth/setup", { setupSecret: SETUP_SECRET }), env),
  );
  expect(step1.status).toBe(200);
  const { salt } = (await responseJson(step1)) as { salt: string };
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
  return env;
}

/** Logs in and returns the session id. */
async function loginAs(env: Env, email: string, password: string): Promise<string> {
  const pre = await prelogin(
    contextFor(post("https://studio.test/api/auth/prelogin", { email }), env),
  );
  expect(pre.status).toBe(200);
  const { salt } = (await responseJson(pre)) as { salt: string };
  const response = await login(
    contextFor(
      post("https://studio.test/api/auth/login", {
        email,
        clientHash: clientHashFor(password, salt),
      }),
      env,
    ),
  );
  expect(response.status).toBe(200);
  return sessionIdFrom(response);
}

/** Logs in with an explicit client hash (for failure paths). */
async function loginWithHash(env: Env, email: string, clientHash: string) {
  return login(contextFor(post("https://studio.test/api/auth/login", { email, clientHash }), env));
}

/** Invites a professional (admin session required) and returns the account id and token. */
async function invitePro(
  env: Env,
  adminSession: string,
  email: string,
): Promise<{ accountId: string; token: string }> {
  const response = await invite(
    contextFor(
      post(
        "https://studio.test/api/auth/accounts",
        { email, role: "pro" },
        cookieHeader(adminSession),
      ),
      env,
    ),
  );
  expect(response.status).toBe(201);
  const { inviteToken } = (await responseJson(response)) as { inviteToken: string };

  const list = await listAccounts(
    contextFor(get("https://studio.test/api/auth/accounts", cookieHeader(adminSession)), env),
  );
  const accounts = (
    (await responseJson(list)) as { accounts: Array<{ id: string; email: string }> }
  ).accounts;
  const account = accounts.find((entry) => entry.email === email);
  expect(account).toBeDefined();
  return { accountId: account?.id ?? "", token: inviteToken };
}

/** Completes the set-password flow with a token and returns the new session id. */
async function setPasswordWithToken(env: Env, token: string, password: string): Promise<string> {
  const step1 = await setPassword(
    contextFor(post("https://studio.test/api/auth/set-password", { token }), env),
  );
  expect(step1.status).toBe(200);
  const { salt } = (await responseJson(step1)) as { salt: string };
  const step2 = await setPassword(
    contextFor(
      post("https://studio.test/api/auth/set-password", {
        token,
        clientHash: clientHashFor(password, salt),
      }),
      env,
    ),
  );
  expect(step2.status).toBe(200);
  return sessionIdFrom(step2);
}

async function isAuthenticated(env: Env, sessionId: string): Promise<boolean> {
  const response = await me(
    contextFor(get("https://studio.test/api/auth/me", cookieHeader(sessionId)), env),
  );
  return ((await responseJson(response)) as { authenticated: boolean }).authenticated;
}

describe("auth API flows (real handlers + real schema via node:sqlite)", () => {
  beforeEach(() => {
    resetRateLimitMemory();
  });

  describe("setup", () => {
    it("creates the first admin in two steps, then refuses a second admin", async () => {
      const env = await envWithAdmin();

      const again = await setup(
        contextFor(
          post("https://studio.test/api/auth/setup", {
            setupSecret: SETUP_SECRET,
            email: "second@studio.test",
            salt: "a".repeat(32),
            clientHash: clientHashFor("whatever-password", "a".repeat(32)),
          }),
          env,
        ),
      );
      expect(again.status).toBe(409);
      expect(((await responseJson(again)) as { error: { code: string } }).error.code).toBe(
        "admin_already_exists",
      );
    });

    it("rejects a wrong setup secret", async () => {
      const env = makeEnv();
      const response = await setup(
        contextFor(post("https://studio.test/api/auth/setup", { setupSecret: "wrong" }), env),
      );
      expect(response.status).toBe(401);
    });

    it("rejects a cross-site request", async () => {
      const env = makeEnv();
      const response = await setup(
        contextFor(
          post(
            "https://studio.test/api/auth/setup",
            { setupSecret: SETUP_SECRET },
            { "sec-fetch-site": "cross-site" },
          ),
          env,
        ),
      );
      expect(response.status).toBe(403);
    });
  });

  describe("login and session", () => {
    it("rejects an unknown email without revealing it", async () => {
      const env = await envWithAdmin();
      const response = await loginWithHash(
        env,
        "nobody@studio.test",
        clientHashFor("whatever-password", "0".repeat(32)),
      );
      expect(response.status).toBe(401);
      expect(((await responseJson(response)) as { error: { code: string } }).error.code).toBe(
        "invalid_credentials",
      );
    });

    it("rejects a wrong password and accepts the right one, setting a __Host- cookie", async () => {
      const env = await envWithAdmin();
      const wrong = await loginWithHash(
        env,
        ADMIN_EMAIL,
        clientHashFor("wrong-password-999", "0".repeat(32)),
      );
      expect(wrong.status).toBe(401);

      const sessionId = await loginAs(env, ADMIN_EMAIL, ADMIN_PASSWORD);
      expect(sessionId).toMatch(/^[A-Za-z0-9_-]{43}$/);

      expect(await isAuthenticated(env, sessionId)).toBe(true);
    });

    it("sets the session cookie with HttpOnly, Secure and SameSite=Lax", async () => {
      const env = await envWithAdmin();
      const pre = await prelogin(
        contextFor(post("https://studio.test/api/auth/prelogin", { email: ADMIN_EMAIL }), env),
      );
      const { salt } = (await responseJson(pre)) as { salt: string };
      const response = await loginWithHash(env, ADMIN_EMAIL, clientHashFor(ADMIN_PASSWORD, salt));
      const setCookie = response.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain(`${SESSION_COOKIE}=`);
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
      expect(setCookie).toContain("SameSite=Lax");
      expect(setCookie).toContain("Path=/");
      expect(setCookie).not.toContain("Domain=");
    });

    it("answers me with authenticated:false without a cookie, and never caches", async () => {
      const env = await envWithAdmin();
      const response = await me(contextFor(get("https://studio.test/api/auth/me"), env));
      expect(response.status).toBe(200);
      expect(((await responseJson(response)) as { authenticated: boolean }).authenticated).toBe(
        false,
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("logs out: the session dies server-side and the cookie is cleared", async () => {
      const env = await envWithAdmin();
      const sessionId = await loginAs(env, ADMIN_EMAIL, ADMIN_PASSWORD);

      const out = await logout(
        contextFor(post("https://studio.test/api/auth/logout", {}, cookieHeader(sessionId)), env),
      );
      expect(out.status).toBe(200);
      expect(out.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=;`);
      expect(out.headers.get("set-cookie")).toContain("Max-Age=0");

      expect(await isAuthenticated(env, sessionId)).toBe(false);
    });

    it("rate-limits repeated failures per email (429 after 5)", async () => {
      const env = await envWithAdmin();
      const email = "brute@studio.test";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await loginWithHash(
          env,
          email,
          clientHashFor("wrong-password-999", "0".repeat(32)),
        );
        expect(response.status).toBe(401);
      }
      const blocked = await loginWithHash(
        env,
        email,
        clientHashFor("wrong-password-999", "0".repeat(32)),
      );
      expect(blocked.status).toBe(429);
    });
  });

  describe("invite and set-password (professional onboarding)", () => {
    it("invites a pro, who sets a password via the token and is auto-logged-in", async () => {
      const env = await envWithAdmin();
      const adminSession = await loginAs(env, ADMIN_EMAIL, ADMIN_PASSWORD);

      const { token } = await invitePro(env, adminSession, PRO_EMAIL);
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

      const proSession = await setPasswordWithToken(env, token, PRO_PASSWORD);
      expect(await isAuthenticated(env, proSession)).toBe(true);

      const meResponse = await me(
        contextFor(get("https://studio.test/api/auth/me", cookieHeader(proSession)), env),
      );
      const meBody = (await responseJson(meResponse)) as {
        account: { role: string; status: string };
      };
      expect(meBody.account.role).toBe("pro");
      expect(meBody.account.status).toBe("active");
    });

    it("makes the invitation token single-use", async () => {
      const env = await envWithAdmin();
      const adminSession = await loginAs(env, ADMIN_EMAIL, ADMIN_PASSWORD);
      const { token } = await invitePro(env, adminSession, PRO_EMAIL);
      await setPasswordWithToken(env, token, PRO_PASSWORD);

      const replay = await setPassword(
        contextFor(post("https://studio.test/api/auth/set-password", { token }), env),
      );
      expect(replay.status).toBe(401);
    });

    it("rejects an unknown token", async () => {
      const env = await envWithAdmin();
      const response = await setPassword(
        contextFor(
          post("https://studio.test/api/auth/set-password", { token: "x".repeat(43) }),
          env,
        ),
      );
      expect(response.status).toBe(401);
    });
  });

  describe("admin-only account management", () => {
    async function envWithPro(): Promise<{
      env: Env;
      adminSession: string;
      proSession: string;
      proId: string;
    }> {
      const env = await envWithAdmin();
      const adminSession = await loginAs(env, ADMIN_EMAIL, ADMIN_PASSWORD);
      const { accountId, token } = await invitePro(env, adminSession, PRO_EMAIL);
      const proSession = await setPasswordWithToken(env, token, PRO_PASSWORD);
      return { env, adminSession, proSession, proId: accountId };
    }

    it("lists accounts for the admin and refuses a pro (403) or anonymous (401)", async () => {
      const { env, adminSession, proSession } = await envWithPro();

      const asAdmin = await listAccounts(
        contextFor(get("https://studio.test/api/auth/accounts", cookieHeader(adminSession)), env),
      );
      expect(asAdmin.status).toBe(200);
      const accounts = (
        (await responseJson(asAdmin)) as {
          accounts: Array<{ email: string; salt?: string; password_hash?: string }>;
        }
      ).accounts;
      expect(accounts.map((account) => account.email).sort()).toEqual(
        [ADMIN_EMAIL, PRO_EMAIL].sort(),
      );
      for (const account of accounts) {
        expect(account.salt).toBeUndefined();
        expect(account.password_hash).toBeUndefined();
      }

      const asPro = await listAccounts(
        contextFor(get("https://studio.test/api/auth/accounts", cookieHeader(proSession)), env),
      );
      expect(asPro.status).toBe(403);

      const asAnonymous = await listAccounts(
        contextFor(get("https://studio.test/api/auth/accounts"), env),
      );
      expect(asAnonymous.status).toBe(401);
    });

    it("refuses to invite an admin role through the API", async () => {
      const { env, adminSession } = await envWithPro();
      const response = await invite(
        contextFor(
          post(
            "https://studio.test/api/auth/accounts",
            { email: "second-admin@studio.test", role: "admin" },
            cookieHeader(adminSession),
          ),
          env,
        ),
      );
      expect(response.status).toBe(400);
    });

    it("refuses duplicate emails on invite", async () => {
      const { env, adminSession } = await envWithPro();
      const response = await invite(
        contextFor(
          post(
            "https://studio.test/api/auth/accounts",
            { email: PRO_EMAIL, role: "pro" },
            cookieHeader(adminSession),
          ),
          env,
        ),
      );
      expect(response.status).toBe(409);
    });

    it("suspends a pro: sessions die immediately and login is refused", async () => {
      const { env, adminSession, proSession, proId } = await envWithPro();

      const suspended = await suspend(
        contextFor(
          post(
            `https://studio.test/api/auth/accounts/${proId}/suspend`,
            {},
            cookieHeader(adminSession),
          ),
          env,
          { id: proId },
        ),
      );
      expect(suspended.status).toBe(200);

      expect(await isAuthenticated(env, proSession)).toBe(false);

      const pre = await prelogin(
        contextFor(post("https://studio.test/api/auth/prelogin", { email: PRO_EMAIL }), env),
      );
      const { salt } = (await responseJson(pre)) as { salt: string };
      const blocked = await loginWithHash(env, PRO_EMAIL, clientHashFor(PRO_PASSWORD, salt));
      expect(blocked.status).toBe(403);
      expect(((await responseJson(blocked)) as { error: { code: string } }).error.code).toBe(
        "account_suspended",
      );
    });

    it("restores a suspended pro: login works again with the same password", async () => {
      const { env, adminSession, proId } = await envWithPro();
      await suspend(
        contextFor(
          post(
            `https://studio.test/api/auth/accounts/${proId}/suspend`,
            {},
            cookieHeader(adminSession),
          ),
          env,
          { id: proId },
        ),
      );
      const restored = await restore(
        contextFor(
          post(
            `https://studio.test/api/auth/accounts/${proId}/restore`,
            {},
            cookieHeader(adminSession),
          ),
          env,
          { id: proId },
        ),
      );
      expect(restored.status).toBe(200);

      const sessionId = await loginAs(env, PRO_EMAIL, PRO_PASSWORD);
      expect(sessionId).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it("revokes a pro: login is refused and existing sessions die", async () => {
      const { env, adminSession, proSession, proId } = await envWithPro();
      const revoked = await revoke(
        contextFor(
          post(
            `https://studio.test/api/auth/accounts/${proId}/revoke`,
            {},
            cookieHeader(adminSession),
          ),
          env,
          { id: proId },
        ),
      );
      expect(revoked.status).toBe(200);

      expect(await isAuthenticated(env, proSession)).toBe(false);

      const pre = await prelogin(
        contextFor(post("https://studio.test/api/auth/prelogin", { email: PRO_EMAIL }), env),
      );
      const { salt } = (await responseJson(pre)) as { salt: string };
      const blocked = await loginWithHash(env, PRO_EMAIL, clientHashFor(PRO_PASSWORD, salt));
      expect(blocked.status).toBe(403);
      expect(((await responseJson(blocked)) as { error: { code: string } }).error.code).toBe(
        "account_revoked",
      );
    });

    it("protects the admin from self-suspension", async () => {
      const env = await envWithAdmin();
      const adminSession = await loginAs(env, ADMIN_EMAIL, ADMIN_PASSWORD);
      const list = await listAccounts(
        contextFor(get("https://studio.test/api/auth/accounts", cookieHeader(adminSession)), env),
      );
      const accounts = (
        (await responseJson(list)) as { accounts: Array<{ id: string; role: string }> }
      ).accounts;
      const admin = accounts.find((account) => account.role === "admin");

      const selfSuspend = await suspend(
        contextFor(
          post(
            `https://studio.test/api/auth/accounts/${admin?.id ?? ""}/suspend`,
            {},
            cookieHeader(adminSession),
          ),
          env,
          { id: admin?.id ?? "" },
        ),
      );
      expect(selfSuspend.status).toBe(400);
    });
  });

  describe("cross-site protection", () => {
    it("rejects mutations with Sec-Fetch-Site: cross-site and a foreign Origin", async () => {
      const env = await envWithAdmin();
      const crossSiteResponse = await login(
        contextFor(
          post(
            "https://studio.test/api/auth/login",
            { email: ADMIN_EMAIL, clientHash: "x".repeat(43) },
            { "sec-fetch-site": "cross-site" },
          ),
          env,
        ),
      );
      expect(crossSiteResponse.status).toBe(403);

      const foreignOrigin = await login(
        contextFor(
          post(
            "https://studio.test/api/auth/login",
            { email: ADMIN_EMAIL, clientHash: "x".repeat(43) },
            { origin: "https://evil.example" },
          ),
          env,
        ),
      );
      expect(foreignOrigin.status).toBe(403);
    });
  });

  describe("audit trail", () => {
    it("records security-relevant actions", async () => {
      const env = await envWithAdmin();
      await loginAs(env, ADMIN_EMAIL, ADMIN_PASSWORD);

      const rows = await env.DB.prepare(
        "SELECT action FROM audit_log ORDER BY created_at ASC",
      ).all<{ action: string }>();
      const actions = rows.results.map((row) => row.action);
      expect(actions).toContain("setup_completed");
      expect(actions).toContain("login_success");
    });
  });
});
