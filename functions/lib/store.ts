import { isoFromMs, isoNow, SESSION_HARD_CAP_MS, SESSION_MAX_AGE_MS } from "./session";

/**
 * Typed access to the D1 auth schema (functions/schema.sql). All account and session
 * reads/writes go through here so the SQL lives in exactly one place.
 */

export type AccountRole = "admin" | "pro";
export type AccountStatus = "invited" | "active" | "suspended" | "revoked";

export interface AccountRow {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  salt: string;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

/** The account shape returned to clients: never includes salt or password_hash. */
export interface PublicAccount {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  created_at: string;
  last_login_at: string | null;
}

export interface SessionRow {
  id: string;
  account_id: string;
  created_at: string;
  expires_at: string;
  hard_expires_at: string;
}

export function toPublicAccount(account: AccountRow): PublicAccount {
  return {
    id: account.id,
    email: account.email,
    role: account.role,
    status: account.status,
    created_at: account.created_at,
    last_login_at: account.last_login_at,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export async function findAccountByEmail(
  db: D1Database,
  email: string,
): Promise<AccountRow | null> {
  return db
    .prepare("SELECT * FROM accounts WHERE email = ?")
    .bind(normalizeEmail(email))
    .first<AccountRow>();
}

export async function findAccountById(db: D1Database, id: string): Promise<AccountRow | null> {
  return db.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first<AccountRow>();
}

export async function listAccounts(db: D1Database): Promise<AccountRow[]> {
  const result = await db
    .prepare("SELECT * FROM accounts ORDER BY role DESC, created_at ASC")
    .all<AccountRow>();
  return result.results;
}

export interface NewAccount {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  salt: string;
  passwordHash: string | null;
}

export async function createAccount(db: D1Database, account: NewAccount): Promise<void> {
  const now = isoNow();
  await db
    .prepare(
      "INSERT INTO accounts (id, email, role, status, salt, password_hash, created_at, updated_at, last_login_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)",
    )
    .bind(
      account.id,
      normalizeEmail(account.email),
      account.role,
      account.status,
      account.salt,
      account.passwordHash,
      now,
      now,
    )
    .run();
}

/**
 * Creates the first admin account, atomically: the INSERT only happens while no
 * admin exists (security-review amendment). Returns false when an admin already
 * exists, so concurrent setups cannot create two.
 */
export async function createFirstAdminIfNone(
  db: D1Database,
  account: NewAccount,
): Promise<boolean> {
  const now = isoNow();
  const result = await db
    .prepare(
      "INSERT INTO accounts (id, email, role, status, salt, password_hash, created_at, updated_at, last_login_at) " +
        "SELECT ?, ?, 'admin', ?, ?, ?, ?, ?, NULL " +
        "WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE role = 'admin')",
    )
    .bind(
      account.id,
      normalizeEmail(account.email),
      account.status,
      account.salt,
      account.passwordHash,
      now,
      now,
    )
    .run();
  return (result.meta.changes ?? 0) === 1;
}

export async function setAccountPassword(
  db: D1Database,
  accountId: string,
  passwordHash: string,
): Promise<void> {
  // Setting a password also activates an invited account.
  await db
    .prepare(
      "UPDATE accounts SET password_hash = ?, status = 'active', updated_at = ? WHERE id = ?",
    )
    .bind(passwordHash, isoNow(), accountId)
    .run();
}

export async function setAccountStatus(
  db: D1Database,
  accountId: string,
  status: AccountStatus,
): Promise<void> {
  await db
    .prepare("UPDATE accounts SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, isoNow(), accountId)
    .run();
}

export async function touchLastLogin(db: D1Database, accountId: string): Promise<void> {
  await db
    .prepare("UPDATE accounts SET last_login_at = ? WHERE id = ?")
    .bind(isoNow(), accountId)
    .run();
}

export async function createSession(
  db: D1Database,
  session: { id: string; accountId: string },
): Promise<SessionRow> {
  const nowMs = Date.now();
  const row: SessionRow = {
    id: session.id,
    account_id: session.accountId,
    created_at: isoNow(),
    expires_at: isoFromMs(nowMs + SESSION_MAX_AGE_MS),
    hard_expires_at: isoFromMs(nowMs + SESSION_HARD_CAP_MS),
  };
  await db
    .prepare(
      "INSERT INTO sessions (id, account_id, created_at, expires_at, hard_expires_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(row.id, row.account_id, row.created_at, row.expires_at, row.hard_expires_at)
    .run();
  return row;
}

export async function findSession(db: D1Database, id: string): Promise<SessionRow | null> {
  return db.prepare("SELECT * FROM sessions WHERE id = ?").bind(id).first<SessionRow>();
}

export async function renewSession(db: D1Database, id: string, expiresAt: string): Promise<void> {
  await db.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").bind(expiresAt, id).run();
}

export async function deleteSession(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}

export async function deleteSessionsForAccount(db: D1Database, accountId: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE account_id = ?").bind(accountId).run();
}

export interface TokenRow {
  token_hash: string;
  account_id: string;
  purpose: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export async function createToken(
  db: D1Database,
  token: { tokenHash: string; accountId: string; purpose: "set-password"; expiresAt: string },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO account_tokens (token_hash, account_id, purpose, created_at, expires_at, used_at) " +
        "VALUES (?, ?, ?, ?, ?, NULL)",
    )
    .bind(token.tokenHash, token.accountId, token.purpose, isoNow(), token.expiresAt)
    .run();
}

export async function findToken(db: D1Database, tokenHash: string): Promise<TokenRow | null> {
  return db
    .prepare("SELECT * FROM account_tokens WHERE token_hash = ?")
    .bind(tokenHash)
    .first<TokenRow>();
}

/**
 * Consumes a token atomically (security-review amendment): the UPDATE only matches an
 * unused, unexpired token, and `changes()` tells whether this call won. Returns the
 * account id when the token was valid and is now consumed.
 */
export async function consumeToken(
  db: D1Database,
  tokenHash: string,
  nowMs: number = Date.now(),
): Promise<string | null> {
  const row = await findToken(db, tokenHash);
  if (!row || row.used_at !== null || Date.parse(row.expires_at) <= nowMs) {
    return null;
  }
  const result = await db
    .prepare(
      "UPDATE account_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?",
    )
    .bind(isoFromMs(nowMs), tokenHash, isoFromMs(nowMs))
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    return null;
  }
  return row.account_id;
}

export async function deleteTokensForAccount(db: D1Database, accountId: string): Promise<void> {
  await db.prepare("DELETE FROM account_tokens WHERE account_id = ?").bind(accountId).run();
}

export async function audit(
  db: D1Database,
  entry: {
    id: string;
    actorAccountId?: string;
    action: string;
    targetAccountId?: string;
    detail?: string;
    ip?: string;
  },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO audit_log (id, actor_account_id, action, target_account_id, detail, ip, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      entry.id,
      entry.actorAccountId ?? null,
      entry.action,
      entry.targetAccountId ?? null,
      entry.detail ?? null,
      entry.ip ?? null,
      isoNow(),
    )
    .run();
}
