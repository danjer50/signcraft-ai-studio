# SignCraft AI Studio

Professional AI-assisted sign design studio. This repository holds the **product interface**,
**customer template & customisation**, **storefront photo**, **visual mockup** and **Admin/Pro
authentication** milestones: a bilingual (FR/EN/AR, RTL) landing page for the product, a working local
customer demonstration with a template catalogue, a clearly labelled entry point for the professional
workspace, a shared Admin/Pro login with server-enforced roles (Cloudflare Pages Functions + D1), the
application shell, design system, automated checks and CI.

**What genuinely works today**

- The landing page: product headline, calls to action, and a gallery of example sign styles labelled as
  illustrations.
- The customer flow at `/{locale}/create`: type your business name, pick one of ten sign templates
  (neon glow, illuminated letters, 3D metal lettering, minimal, blade sign, awning band, window vinyl,
  lightbox plaque, marquee bulbs, floor totem) and customise its colours with named swatches. The
  preview — including the selected template's name — updates instantly on every change.
- Storefront photo and sign area, fully client-side: upload a photo of your storefront (validated by
  magic bytes, capped at 12 MB and 4096×4096 px), then drag to mark where the sign should appear.
  The selection is adjustable (handles, mouse, touch and keyboard), can be cleared and redrawn, and
  is stored as normalised coordinates in the serialisable customer draft. The original photo is kept
  unmodified in memory and is never uploaded; the marked area is labelled as a schematic placement.
- Basic visual mockup, fully client-side: a real button renders a flat, axis-aligned placement of your
  sign — text, tagline, template style and colours — inside the marked area, directly on your photo,
  and offers a PNG download. It is clearly labelled: no perspective correction, no environmental
  lighting, no cast shadows, not fabrication-ready. Rendering is user-initiated and throttled; the
  photo and the mockup never leave the browser.
  The page states in plain language that the preview is a local style composition — not AI-generated
  imagery and not a technically accurate fabrication model.
- Localisation and RTL for French (default), English and Arabic, including keyboard navigation,
  responsive navigation and a 404 page with the right language and direction.
- Shared Admin/Pro authentication (Milestone 5): one login page at `/{locale}/login` for both roles.
  Admins land in the Admin Space (`/{locale}/admin`, account management: invite, suspend, restore,
  revoke), professionals land in the Professional Studio (`/{locale}/studio`). Permissions are
  enforced server-side by Pages Functions backed by Cloudflare D1; the raw password never leaves the
  browser (PBKDF2 pre-hash + server pepper); sessions are HttpOnly `__Host-` cookies; login and setup
  are rate-limited; every security-relevant action is audited. The customer space stays free: no
  accounts, no login. See `docs/ARCHITECTURE.md`, section 11.

**Planned, labelled as such, with no controls that pretend otherwise:** AI generation,
revision requests, realistic AI mockups (perspective, lighting, shadows), the professional 2D/3D
design and fabrication tools (exact dimensions,
3D geometry, materials, LED layout, technical drawings, fabrication exports), project persistence and
project transfer into the Professional Studio. The professional entry point at `/{locale}/pro`
describes these tools and marks each one "Planned"; it contains no fake editor. The Professional
Studio at `/{locale}/studio` is a real signed-in workspace, and its editing tools are labelled
"Planned". Deployment is configured (`wrangler.toml`, Cloudflare Pages) but not performed.

Architecture decisions and known limitations: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Design tokens and component rules: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Requirements

- Node.js 22 (the version in `.nvmrc`). The project requires Node.js 20.9 or later.
- npm (bundled with Node.js).

## Getting started

```bash
npm ci          # install exactly the versions in package-lock.json
npm run dev     # development server at http://localhost:3000 (redirects to /fr)
```

## Scripts

| Script                 | What it does                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Development server with hot reload.                                                                                                                                 |
| `npm run build`        | Production build: the static export in `out/` (all locale pages incl. `/create`, `/pro`, `/login`, `/admin`, `/studio`, `/setup`, `/set-password`, and `404.html`). |
| `npm start`            | Serves the export with `wrangler pages dev` (auth API included, local D1). Run `npm run build` first.                                                               |
| `npm run test:server`  | Fresh local test server: deterministic test secrets, local D1 schema + seed, `wrangler pages dev` (port `PORT` or 8788). Used by the smoke and browser tests.       |
| `npm run lint`         | ESLint over the whole repository.                                                                                                                                   |
| `npm run typecheck`    | Generates route types, then runs `tsc --noEmit`.                                                                                                                    |
| `npm test`             | Unit and component tests (Vitest).                                                                                                                                  |
| `npm run test:watch`   | Tests in watch mode.                                                                                                                                                |
| `npm run test:smoke`   | Starts `npm run test:server` and checks real HTTP responses, the exported 404 document and the auth API. Run the build first.                                       |
| `npm run test:e2e`     | Browser tests (Playwright, Chromium) against the production export + auth API, at 360, 768 and 1280 px. Run the build first.                                        |
| `npm run format`       | Formats the repository with Prettier.                                                                                                                               |
| `npm run format:check` | Checks formatting without changing files.                                                                                                                           |
| `npm run check`        | Everything above, in order: format, lint, typecheck, test, build, smoke.                                                                                            |

CI runs `npm run check` on every push and pull request. A second job runs the browser tests
(`.github/workflows/ci.yml`). Browser tests need Chromium: run `npx playwright install chromium` once, or set
`E2E_CHROMIUM_PATH` to an installed Chromium.

## Languages

| Code | Language | Direction | Notes                         |
| ---- | -------- | --------- | ----------------------------- |
| `fr` | Français | LTR       | Default. `/` redirects here.  |
| `en` | English  | LTR       |                               |
| `ar` | العربية  | RTL       | Sets `dir="rtl"` on `<html>`. |

Messages live in `src/i18n/messages/`. `fr` and `ar` must have exactly the keys of `en`. The tests check
this.

Unknown URLs return HTTP 404 with a page in the language of their locale, for example `/en/a/b` in English.
An unknown locale such as `/de` gets the French page. The reasons for this design, and the experimental
Next.js feature it uses, are in `docs/ARCHITECTURE.md`, section 4.

## Project layout

```
src/app/[locale]/       Locale routes: layout (html lang/dir, app shell), landing page,
                        /create (customer demo), /pro (professional entry point),
                        /login, /admin, /studio, /setup, /set-password (auth, Milestone 5)
src/app/global-not-found.tsx  The exported 404 document: three locale variants + detection script
src/components/         app-shell (incl. AppDocument), auth (login/admin/studio/setup forms,
                        NavAuth), home, workflow (incl. the demo), pro, not-found, ui primitives
src/i18n/               locale configuration, typed dictionaries, path helpers
src/lib/                shared helpers: cx, the browser password pre-hash, the auth API client
src/styles/             design tokens, global styles, token and RTL tests
src/templates/          the customer template catalogue, colour palette and the
                        serialisable customer draft (v2: photo metadata + selection)
src/projects/           client-side photo validation, the in-memory photo store and the
                        flat visual-mockup renderer (canvas + PNG export)
functions/              the auth API (Pages Functions) + its D1 schema and tests
wrangler.toml           Cloudflare Pages project config (placeholder D1 database_id)
public/                 static assets and the Pages files (_headers, _redirects, _routes.json,
                        not-found-locale.js); images/ holds the illustrative photography
e2e/                    browser tests (Playwright), incl. auth.spec.ts and fixtures/seed.sql
scripts/smoke-test.mjs  production HTTP + auth API smoke test (starts `npm run test:server`)
scripts/test-env.mjs    writes the gitignored .dev.vars with TEST-ONLY local secrets
docs/                   architecture and design system
```

## Known limitations

- The app is a static export served by Cloudflare Pages; the 404 page is one static document whose
  locale is detected in the browser, so without JavaScript a 404 shows the default locale. The 404
  page uses `experimental.globalNotFound` in Next.js 16.4, so `next` is pinned to 16.4.0 exactly. See
  `docs/ARCHITECTURE.md`, sections 4 and 8.
- ESLint 9 is end-of-life according to ESLint's notice. Upgrading is blocked by the plugin peer ranges of
  `eslint-config-next`.
- `npm audit` reports five high-severity findings in the dev-only linting chain (`braces` 3.0.3, no patched
  release yet). `npm audit --omit=dev` reports none. See `docs/ARCHITECTURE.md`, section 8.
- Browser tests run in CI, not in `npm run check`, because they need a Chromium binary. They cover the
  locale pages, the product surface (landing page, the live demo, the storefront photo flow, the
  visual mockup flow, the professional entry point), the auth flows (login, onboarding, guards,
  account management, rate limiting) and the 404 pages at 360, 768 and 1280 px. They do not replace a review by a native speaker of the French and
  Arabic copy, which is still a draft. See `docs/ARCHITECTURE.md`, section 8.
- The auth system has honest limits: no email delivery (invitation links are copied manually), the
  browser pre-hash is replayable but site-specific, free-tier ceilings apply (only the auth API is
  affected if they are hit), and a strict CSP is deferred (see `docs/ARCHITECTURE.md`, section 8).

## Deployment

Configured for Cloudflare Pages, **not deployed**. `wrangler.toml` describes the project (static
export in `out/`, Pages Functions from `functions/`, one D1 database with a placeholder
`database_id`) and contains no secrets. Deployment is a separate, owner-approved step: create the D1
database and apply `functions/schema.sql`, set `SETUP_SECRET` and `PASSWORD_PEPPER` with
`wrangler pages secret put`, configure a separate preview database and secrets, complete the one-time
admin setup at `/{locale}/setup`, and optionally configure the single free WAF rate-limiting rule on
`/api/auth/*` (proxied custom domains only). The full checklist is in `docs/ROADMAP.md` (Milestone 5,
migration note 6). Local preview: `npm run build && npm start` (or `npm run test:server` for the
seeded test environment).

**Vercel previews.** The repository also carries a `vercel.json` so the connected Vercel
project can serve the static export as a pure static site (`out/`, clean URLs, `/` → `/fr`).
It exists because Vercel's Next.js builder cannot package this export: the builder renames
`fr/create.html` to `fr/create`, which collides with the `fr/create/` directory of Next.js 16
segment payloads, so every page is dropped from the deployment (Ready, but 404 everywhere).
Serving `out/` statically bypasses the builder. The Vercel preview is pages-only: the auth API
is Cloudflare Pages Functions and is not part of the Vercel deployment. Cloudflare Pages ignores
`vercel.json`.
