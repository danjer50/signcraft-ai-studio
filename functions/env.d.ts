/**
 * Environment for the auth API (Milestone 5).
 *
 * - DB: the D1 binding from wrangler.toml.
 * - SETUP_SECRET / PASSWORD_PEPPER: secrets, set per environment with
 *   `wrangler pages secret put`. Local tests use the deterministic TEST-ONLY values
 *   written to the gitignored `.dev.vars` by scripts/test-env.mjs. Never commit real
 *   values; never log them.
 * - The rate-limit knobs are optional strings (Workers env vars are strings).
 */
export interface Env {
  DB: D1Database;
  SETUP_SECRET: string;
  PASSWORD_PEPPER: string;
  /** Max failed attempts per email/token key per window. Default 5. */
  AUTH_RATE_LIMIT_MAX_ATTEMPTS?: string;
  /** Max failed attempts per IP per window. Default 20. Raised in local tests. */
  AUTH_RATE_LIMIT_IP_MAX_ATTEMPTS?: string;
  /** Rate-limit window in milliseconds. Default 15 minutes. */
  AUTH_RATE_LIMIT_WINDOW_MS?: string;
}
