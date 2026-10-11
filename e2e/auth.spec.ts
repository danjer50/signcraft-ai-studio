import { pbkdf2Sync } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { locales, type Locale } from "../src/i18n/config";
import { getMessages } from "../src/i18n/get-messages";

/**
 * Milestone 5: the authentication and Admin/Professional access system.
 *
 * The server is `npm run test:server` (wrangler pages dev): the static export plus the
 * auth Pages Functions, with a fresh local D1 seeded with one admin
 * (admin@studio.test / StudioTest!Passw0rd — see e2e/fixtures/seed.sql). Tests that
 * mutate accounts create their own professionals with unique emails, because all
 * projects share one database.
 */

const SEED_ADMIN_EMAIL = "admin@studio.test";
const SEED_ADMIN_PASSWORD = "StudioTest!Passw0rd";
const TEST_SETUP_SECRET = "test-only-setup-secret-0f1e2d3c";

/** The browser-side pre-hash, computed with Node's crypto (same algorithm as the client). */
function clientHashFor(password: string, saltHex: string): string {
  return pbkdf2Sync(
    Buffer.from(password.normalize("NFKC"), "utf8"),
    Buffer.from(saltHex, "hex"),
    600_000,
    32,
    "sha256",
  ).toString("base64url");
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@studio.test`;
}

function sessionIdFrom(response: { headers: () => Record<string, string> }): string {
  const setCookie = response.headers()["set-cookie"] ?? "";
  return setCookie.match(/__Host-sc_session=([^;]+)/)?.[1] ?? "";
}

function cookieHeader(sessionId: string): Record<string, string> {
  return { cookie: `__Host-sc_session=${sessionId}` };
}

/** Logs in over the API and returns the session id. */
async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const pre = await request.post("/api/auth/prelogin", { data: { email } });
  expect(pre.status()).toBe(200);
  const { salt } = (await pre.json()) as { salt: string };
  const login = await request.post("/api/auth/login", {
    data: { email, clientHash: clientHashFor(password, salt) },
  });
  expect(login.status()).toBe(200);
  return sessionIdFrom(login);
}

/** Invites a professional (admin session required) and returns the token and account id. */
async function apiInvitePro(
  request: APIRequestContext,
  adminSession: string,
  email: string,
): Promise<{ token: string; accountId: string }> {
  const invite = await request.post("/api/auth/accounts", {
    data: { email, role: "pro" },
    headers: cookieHeader(adminSession),
  });
  expect(invite.status()).toBe(201);
  const { inviteToken } = (await invite.json()) as { inviteToken: string };

  const list = await request.get("/api/auth/accounts", { headers: cookieHeader(adminSession) });
  const { accounts } = (await list.json()) as {
    accounts: Array<{ id: string; email: string }>;
  };
  const account = accounts.find((entry) => entry.email === email);
  expect(account).toBeDefined();
  return { token: inviteToken, accountId: account?.id ?? "" };
}

/** Sets a password through the invitation token and returns the new session id. */
async function apiSetPassword(
  request: APIRequestContext,
  token: string,
  password: string,
): Promise<string> {
  const step1 = await request.post("/api/auth/set-password", { data: { token } });
  expect(step1.status()).toBe(200);
  const { salt } = (await step1.json()) as { salt: string };
  const step2 = await request.post("/api/auth/set-password", {
    data: { token, clientHash: clientHashFor(password, salt) },
  });
  expect(step2.status()).toBe(200);
  return sessionIdFrom(step2);
}

/** Creates a professional end-to-end over the API (invite + set password). */
async function apiCreatePro(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ session: string; accountId: string }> {
  const adminSession = await apiLogin(request, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
  const { token, accountId } = await apiInvitePro(request, adminSession, email);
  const session = await apiSetPassword(request, token, password);
  return { session, accountId };
}

/** Fills and submits the login form in the browser. */
async function loginViaUi(page: Page, locale: Locale, email: string, password: string) {
  const copy = getMessages(locale).auth.login;
  await page.goto(`/${locale}/login`);
  await page.getByLabel(copy.email).fill(email);
  await page.getByLabel(copy.password).fill(password);
  await page.getByRole("button", { name: copy.submit, exact: true }).click();
}

test.describe("auth API", () => {
  test("setup refuses a second admin (the seed already created one)", async ({ request }) => {
    const step1 = await request.post("/api/auth/setup", {
      data: { setupSecret: TEST_SETUP_SECRET },
    });
    expect(step1.status()).toBe(200);
    const { salt } = (await step1.json()) as { salt: string };

    const step2 = await request.post("/api/auth/setup", {
      data: {
        setupSecret: TEST_SETUP_SECRET,
        email: uniqueEmail("second-admin"),
        salt,
        clientHash: clientHashFor("another-password-123", salt),
      },
    });
    expect(step2.status()).toBe(409);
    expect(((await step2.json()) as { error: { code: string } }).error.code).toBe(
      "admin_already_exists",
    );
  });

  test("setup rejects a wrong secret", async ({ request }) => {
    const response = await request.post("/api/auth/setup", { data: { setupSecret: "wrong" } });
    expect(response.status()).toBe(401);
  });

  test("the seeded admin can log in, is recognised by /me, and can log out", async ({
    request,
  }) => {
    const session = await apiLogin(request, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
    expect(session).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const me = await request.get("/api/auth/me", { headers: cookieHeader(session) });
    expect(me.status()).toBe(200);
    const meBody = (await me.json()) as { authenticated: boolean; account: { role: string } };
    expect(meBody.authenticated).toBe(true);
    expect(meBody.account.role).toBe("admin");

    const logout = await request.post("/api/auth/logout", {
      data: {},
      headers: cookieHeader(session),
    });
    expect(logout.status()).toBe(200);

    const meAfter = await request.get("/api/auth/me", { headers: cookieHeader(session) });
    expect(((await meAfter.json()) as { authenticated: boolean }).authenticated).toBe(false);
  });

  test("a wrong password is rejected without revealing whether the account exists", async ({
    request,
  }) => {
    const unknown = await request.post("/api/auth/login", {
      data: {
        email: uniqueEmail("nobody"),
        clientHash: clientHashFor("wrong-password-1", "0".repeat(32)),
      },
    });
    expect(unknown.status()).toBe(401);

    const pre = await request.post("/api/auth/prelogin", {
      data: { email: SEED_ADMIN_EMAIL },
    });
    const { salt } = (await pre.json()) as { salt: string };
    const wrong = await request.post("/api/auth/login", {
      data: {
        email: SEED_ADMIN_EMAIL,
        clientHash: clientHashFor("wrong-password-1", salt),
      },
    });
    expect(wrong.status()).toBe(401);
    // Same error body for both: no account enumeration.
    expect(await wrong.json()).toEqual(await unknown.json());
  });

  test("repeated failures are rate-limited (429 after 5)", async ({ request }) => {
    const email = uniqueEmail("brute");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request.post("/api/auth/login", {
        data: {
          email,
          clientHash: clientHashFor("wrong-password-1", "0".repeat(32)),
        },
      });
      expect(response.status()).toBe(401);
    }
    const blocked = await request.post("/api/auth/login", {
      data: { email, clientHash: clientHashFor("wrong-password-1", "0".repeat(32)) },
    });
    expect(blocked.status()).toBe(429);
  });

  test("cross-site mutations are rejected", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: { email: SEED_ADMIN_EMAIL, clientHash: "x".repeat(43) },
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(response.status()).toBe(403);
  });

  test("account management is admin-only: anonymous 401, professional 403", async ({ request }) => {
    const anonymous = await request.get("/api/auth/accounts");
    expect(anonymous.status()).toBe(401);

    const email = uniqueEmail("pro");
    const { session } = await apiCreatePro(request, email, "ProPassword!123");

    const asPro = await request.get("/api/auth/accounts", { headers: cookieHeader(session) });
    expect(asPro.status()).toBe(403);

    const inviteAsPro = await request.post("/api/auth/accounts", {
      data: { email: uniqueEmail("nested"), role: "pro" },
      headers: cookieHeader(session),
    });
    expect(inviteAsPro.status()).toBe(403);
  });

  test("suspend kills the session and blocks login; restore re-enables it", async ({ request }) => {
    const email = uniqueEmail("suspend-me");
    const password = "ProPassword!123";
    const { session, accountId } = await apiCreatePro(request, email, password);

    const adminSession = await apiLogin(request, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);

    const suspended = await request.post(`/api/auth/accounts/${accountId}/suspend`, {
      data: {},
      headers: cookieHeader(adminSession),
    });
    expect(suspended.status()).toBe(200);

    const meWhileSuspended = await request.get("/api/auth/me", { headers: cookieHeader(session) });
    expect(((await meWhileSuspended.json()) as { authenticated: boolean }).authenticated).toBe(
      false,
    );

    const pre = await request.post("/api/auth/prelogin", { data: { email } });
    const { salt } = (await pre.json()) as { salt: string };
    const blockedLogin = await request.post("/api/auth/login", {
      data: { email, clientHash: clientHashFor(password, salt) },
    });
    expect(blockedLogin.status()).toBe(403);

    const restored = await request.post(`/api/auth/accounts/${accountId}/restore`, {
      data: {},
      headers: cookieHeader(adminSession),
    });
    expect(restored.status()).toBe(200);

    const sessionAgain = await apiLogin(request, email, password);
    expect(sessionAgain).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test("revoke blocks login and kills the session", async ({ request }) => {
    const email = uniqueEmail("revoke-me");
    const password = "ProPassword!123";
    const { session, accountId } = await apiCreatePro(request, email, password);

    const adminSession = await apiLogin(request, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
    const revoked = await request.post(`/api/auth/accounts/${accountId}/revoke`, {
      data: {},
      headers: cookieHeader(adminSession),
    });
    expect(revoked.status()).toBe(200);

    const meAfterRevoke = await request.get("/api/auth/me", { headers: cookieHeader(session) });
    expect(((await meAfterRevoke.json()) as { authenticated: boolean }).authenticated).toBe(false);

    const pre = await request.post("/api/auth/prelogin", { data: { email } });
    const { salt } = (await pre.json()) as { salt: string };
    const blockedLogin = await request.post("/api/auth/login", {
      data: { email, clientHash: clientHashFor(password, salt) },
    });
    expect(blockedLogin.status()).toBe(403);
  });

  test("the admin cannot suspend themselves", async ({ request }) => {
    const adminSession = await apiLogin(request, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
    const list = await request.get("/api/auth/accounts", { headers: cookieHeader(adminSession) });
    const { accounts } = (await list.json()) as {
      accounts: Array<{ id: string; role: string }>;
    };
    const admin = accounts.find((account) => account.role === "admin");
    expect(admin).toBeDefined();

    const selfSuspend = await request.post(`/api/auth/accounts/${admin?.id ?? ""}/suspend`, {
      data: {},
      headers: cookieHeader(adminSession),
    });
    expect(selfSuspend.status()).toBe(400);
  });
});

test.describe("auth pages", () => {
  for (const locale of locales) {
    test(`the ${locale} login page renders in ${locale} (${locale === "ar" ? "RTL" : "LTR"})`, async ({
      page,
    }) => {
      const messages = getMessages(locale);
      const copy = messages.auth.login;

      await page.goto(`/${locale}/login`);

      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.title);
      await expect(page.getByLabel(copy.email)).toBeVisible();
      await expect(page.getByLabel(copy.password)).toBeVisible();
      await expect(page.getByRole("button", { name: copy.submit, exact: true })).toBeVisible();
    });
  }

  test("an admin signing in through the form lands in the Admin Space", async ({ page }) => {
    const messages = getMessages("fr");
    await loginViaUi(page, "fr", SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);

    await expect(page).toHaveURL(/\/fr\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.auth.admin.title);
    // The header now offers the Admin Space and Sign out instead of Sign in.
    await expect(page.getByRole("link", { name: messages.auth.nav.adminSpace })).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("button", { name: messages.auth.nav.signOut }),
    ).toBeVisible();
    // The seeded admin is listed in the accounts table.
    await expect(page.getByRole("cell", { name: SEED_ADMIN_EMAIL })).toBeVisible();
  });

  test("a professional onboards from the invitation link and lands in the Pro Studio", async ({
    page,
    request,
  }) => {
    const messages = getMessages("fr");
    const email = uniqueEmail("onboard");
    const password = "ProPassword!123";

    const adminSession = await apiLogin(request, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
    const { token } = await apiInvitePro(request, adminSession, email);

    await page.goto(`/fr/set-password?token=${token}`);
    await page.getByLabel(messages.auth.setPassword.password).fill(password);
    await page.getByLabel(messages.auth.setPassword.confirm).fill(password);
    await page.getByRole("button", { name: messages.auth.setPassword.submit, exact: true }).click();

    // The token set the password and signed the professional in.
    await expect(page).toHaveURL(/\/fr\/studio$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.auth.studio.title);
    await expect(page.getByText(email)).toBeVisible();
  });

  test("an invalid invitation link shows the invalid-link message", async ({ page }) => {
    const messages = getMessages("fr");
    // A well-formed but unknown token: the API answers 401 invalid_token.
    await page.goto(`/fr/set-password?token=${"x".repeat(43)}`);
    await expect(page.locator("#main-content").getByRole("alert")).toHaveText(
      messages.auth.setPassword.invalidToken,
    );
  });

  test("an anonymous visitor is redirected from /admin and /studio to the login page", async ({
    page,
  }) => {
    await page.goto("/fr/admin");
    await expect(page).toHaveURL(/\/fr\/login$/);

    await page.goto("/fr/studio");
    await expect(page).toHaveURL(/\/fr\/login$/);
  });

  test("a professional visiting /admin is sent to the Pro Studio", async ({ page, request }) => {
    const messages = getMessages("fr");
    const email = uniqueEmail("pro-no-admin");
    const password = "ProPassword!123";
    await apiCreatePro(request, email, password);

    // Sign in through the form, then try to open the Admin Space by URL.
    await loginViaUi(page, "fr", email, password);
    await expect(page).toHaveURL(/\/fr\/studio$/);
    await page.goto("/fr/admin");

    // A professional is sent to their own space: the Admin Space never renders.
    await expect(page).toHaveURL(/\/fr\/studio$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.auth.studio.title);
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("signing out returns to the login page and clears the session", async ({ page }) => {
    const messages = getMessages("fr");
    await loginViaUi(page, "fr", SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/fr\/admin$/);

    await page.getByRole("banner").getByRole("button", { name: messages.auth.nav.signOut }).click();
    await expect(page).toHaveURL(/\/fr\/login$/);

    const me = await page.request.get("/api/auth/me");
    expect(((await me.json()) as { authenticated: boolean }).authenticated).toBe(false);
  });

  test("the customer space stays free: no login is required on / and /create", async ({ page }) => {
    const messages = getMessages("fr");

    const home = await page.goto("/fr");
    expect(home?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.home.title);
    // The header offers Sign in — it never blocks the free space.
    await expect(page.getByRole("link", { name: messages.auth.nav.signIn })).toBeVisible();

    const create = await page.goto("/fr/create");
    expect(create?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.create.title);
  });
});
