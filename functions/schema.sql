-- Milestone 5: auth schema for Cloudflare D1.
--
-- Applied to the LOCAL state by `npm run test:server` (tests and smoke). For a real
-- deployment: `npx wrangler d1 execute DB --file=functions/schema.sql` (remote), once
-- per environment (production and preview use separate databases).
--
-- Timestamps are ISO-8601 UTC strings, which compare correctly as text.

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pro')),
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'suspended', 'revoked')) DEFAULT 'invited',
  -- Per-account salt for the browser-side PBKDF2 pre-hash (hex, 16 bytes).
  salt TEXT NOT NULL,
  -- sha256hex(base64url(PBKDF2-SHA256(password, salt, 600000)) + "." + PASSWORD_PEPPER).
  -- NULL until the password is set. The raw password never reaches the server.
  password_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  -- Sliding expiry: renewed on activity, at most 7 days ahead of the last activity.
  expires_at TEXT NOT NULL,
  -- Absolute cap: created_at + 30 days. Past this the session is deleted, not renewed.
  hard_expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_tokens (
  -- sha256 hex of the one-time token; the raw token is only ever shown once, in the
  -- invitation link the admin copies.
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('set-password')),
  created_at TEXT NOT NULL,
  -- Invitation links expire after one hour.
  expires_at TEXT NOT NULL,
  -- Set when consumed. Consumption is atomic (UPDATE ... WHERE used_at IS NULL).
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  -- e.g. login:email:<sha256(email)>, login:ip:<ip>, setup:ip:<ip>, token:ip:<ip>
  key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  failures INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_account_id TEXT,
  detail TEXT,
  ip TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS account_tokens_account ON account_tokens(account_id);
CREATE INDEX IF NOT EXISTS audit_log_created ON audit_log(created_at);
