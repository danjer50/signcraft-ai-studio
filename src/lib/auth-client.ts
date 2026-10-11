import type { Locale } from "@/i18n/config";

import { prehashPassword } from "./password";

/**
 * Client for the auth API (Cloudflare Pages Functions, see functions/api/auth).
 * Every call sends the page locale so API errors come back in the right language.
 * Sessions live in an HttpOnly `__Host-` cookie; the browser attaches it
 * automatically (same-origin requests).
 */

export type AccountRole = "admin" | "pro";

export interface AuthAccount {
  id: string;
  email: string;
  role: AccountRole;
  status: string;
  created_at: string;
  last_login_at: string | null;
}

export interface SessionInfo {
  authenticated: boolean;
  account?: AuthAccount;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

async function authFetch(locale: Locale, path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-signcraft-locale", locale);
  if (init.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  return fetch(path, { ...init, headers, credentials: "same-origin" });
}

async function parseError(response: Response, fallback: string): Promise<AuthApiError> {
  let message = fallback;
  let code = "error";
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    if (typeof body.error?.message === "string" && body.error.message !== "") {
      message = body.error.message;
    }
    if (typeof body.error?.code === "string") {
      code = body.error.code;
    }
  } catch {
    // Not JSON: keep the fallback message.
  }
  return new AuthApiError(response.status, code, message);
}

async function postJson(locale: Locale, path: string, body: unknown): Promise<Response> {
  return authFetch(locale, path, { method: "POST", body: JSON.stringify(body) });
}

/** The session probe used by the navigation and the gated pages. */
export async function getSession(locale: Locale): Promise<SessionInfo> {
  try {
    const response = await authFetch(locale, "/api/auth/me");
    if (!response.ok) {
      return { authenticated: false };
    }
    return (await response.json()) as SessionInfo;
  } catch {
    // The API is unreachable (offline, or the static export is previewed without the
    // Functions): treat the visitor as anonymous instead of breaking the page.
    return { authenticated: false };
  }
}

/** Signs out and resolves once the server has deleted the session. */
export async function logout(locale: Locale): Promise<void> {
  await postJson(locale, "/api/auth/logout", {});
}

/**
 * Full login flow: fetch the account salt, pre-hash the password in the browser,
 * then send only the client hash. Resolves with the account; throws AuthApiError
 * with a localised message otherwise.
 */
export async function loginWithPassword(
  locale: Locale,
  email: string,
  password: string,
): Promise<AuthAccount> {
  const prelogin = await postJson(locale, "/api/auth/prelogin", { email });
  if (!prelogin.ok) {
    throw await parseError(prelogin, "Sign-in failed.");
  }
  const { salt } = (await prelogin.json()) as { salt: string };
  const clientHash = await prehashPassword(password, salt);
  const response = await postJson(locale, "/api/auth/login", { email, clientHash });
  if (!response.ok) {
    throw await parseError(response, "Sign-in failed.");
  }
  const body = (await response.json()) as { account: AuthAccount };
  return body.account;
}

/** Step 1 of the initial admin setup: fetch a salt for the pre-hash. */
export async function setupFetchSalt(locale: Locale, setupSecret: string): Promise<string> {
  const response = await postJson(locale, "/api/auth/setup", { setupSecret });
  if (!response.ok) {
    throw await parseError(response, "Setup failed.");
  }
  return ((await response.json()) as { salt: string }).salt;
}

/** Step 2 of the initial admin setup: create the first admin account. */
export async function setupCreateAdmin(
  locale: Locale,
  input: { setupSecret: string; email: string; salt: string; password: string },
): Promise<void> {
  const clientHash = await prehashPassword(input.password, input.salt);
  const response = await postJson(locale, "/api/auth/setup", {
    setupSecret: input.setupSecret,
    email: input.email,
    salt: input.salt,
    clientHash,
  });
  if (!response.ok) {
    throw await parseError(response, "Setup failed.");
  }
}

/** Step 1 of the invitation flow: validate the token and fetch the account salt. */
export async function setPasswordFetchSalt(locale: Locale, token: string): Promise<string> {
  const response = await postJson(locale, "/api/auth/set-password", { token });
  if (!response.ok) {
    throw await parseError(response, "This invitation link is invalid or has expired.");
  }
  return ((await response.json()) as { salt: string }).salt;
}

/** Step 2 of the invitation flow: set the password; resolves with the account (auto-login). */
export async function setPasswordWithToken(
  locale: Locale,
  token: string,
  password: string,
  preFetchedSalt: string | null = null,
): Promise<AuthAccount> {
  // The form validates the token on mount and passes the salt it got; a direct call
  // fetches it here.
  const salt = preFetchedSalt ?? (await setPasswordFetchSalt(locale, token));
  const clientHash = await prehashPassword(password, salt);
  const response = await postJson(locale, "/api/auth/set-password", { token, clientHash });
  if (!response.ok) {
    throw await parseError(response, "This invitation link is invalid or has expired.");
  }
  return ((await response.json()) as { account: AuthAccount }).account;
}

/** Admin: the account list (never includes salts or password hashes). */
export async function listAccounts(locale: Locale): Promise<AuthAccount[]> {
  const response = await authFetch(locale, "/api/auth/accounts");
  if (!response.ok) {
    throw await parseError(response, "The accounts could not be loaded.");
  }
  return ((await response.json()) as { accounts: AuthAccount[] }).accounts;
}

/** Admin: invites a professional; resolves with the one-time invitation token. */
export async function inviteProfessional(locale: Locale, email: string): Promise<string> {
  const response = await postJson(locale, "/api/auth/accounts", { email, role: "pro" });
  if (!response.ok) {
    throw await parseError(response, "The invitation could not be created.");
  }
  return ((await response.json()) as { inviteToken: string }).inviteToken;
}

/** Admin: suspends, restores or revokes an account. */
export async function manageAccount(
  locale: Locale,
  accountId: string,
  action: "suspend" | "restore" | "revoke",
): Promise<void> {
  const response = await postJson(locale, `/api/auth/accounts/${accountId}/${action}`, {});
  if (!response.ok) {
    throw await parseError(response, "The action could not be completed.");
  }
}
