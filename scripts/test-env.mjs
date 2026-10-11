#!/usr/bin/env node
/**
 * Writes the gitignored `.dev.vars` with deterministic TEST-ONLY values, so local
 * tests (`npm run test:server`) can exercise the auth API without real secrets.
 *
 * These values are safe to commit nowhere: `.dev.vars` is gitignored, and they only
 * ever apply to wrangler's LOCAL state. Production secrets are set per environment
 * with `wrangler pages secret put` and are never written to disk by this project.
 *
 * The admin seed in e2e/fixtures/seed.sql is precomputed against the pepper below;
 * if you change either, recompute the seed (see the comment in seed.sql).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const contents = `# Written by scripts/test-env.mjs — TEST-ONLY values for local wrangler state.
# Never commit this file (it is gitignored). Never use these values anywhere else.
SETUP_SECRET=test-only-setup-secret-0f1e2d3c
PASSWORD_PEPPER=test-only-pepper-9f8e7d6c5b4a
# Tests share one IP (127.0.0.1), so the per-IP limit is raised to let the per-email
# rate-limit tests trip their own key.
AUTH_RATE_LIMIT_IP_MAX_ATTEMPTS=500
`;

writeFileSync(path.join(projectRoot, ".dev.vars"), contents, "utf8");
console.log("Wrote .dev.vars (test-only local secrets).");
