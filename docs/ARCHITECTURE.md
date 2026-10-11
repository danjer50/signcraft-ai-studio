# Architecture

This document records the architecture of SignCraft AI Studio, the reasons for each choice,
the rejected alternatives, and the constraints found while building the foundation. It describes
what exists today and what is planned. Planned items are labelled as such.

## 1. Scope

**Product interface milestone (implemented):** the product landing page (headline, calls to action,
example gallery labelled as illustrative), the customer flow at `/[locale]/create` with a **working
local demonstration** (sign text, ten templates, colour customisation, live style preview) that states
its limits in plain language, the professional entry point at `/[locale]/pro` with every tool labelled
"Planned", the application shell, responsive navigation, design tokens, UI primitives,
French/English/Arabic (RTL) localisation, automated checks, and CI.

**Customer template & customisation milestone (implemented):** a structured template catalogue
(`src/templates/`) of ten sign templates with named colour slots, an instant local preview driven by
CSS custom properties, and a serialisable, versioned customer draft (`CustomerDraft`) that is the
deliberate seam for the future transfer into the Professional Studio. The catalogue is covered by
schema, localisation-parity and WCAG contrast tests; the draft by round-trip and malformed-input
tests. Everything runs locally in the browser: no accounts, no network calls, no AI.

**Storefront photo milestone (implemented):** client-side storefront photo upload with magic-byte
validation and size/pixel caps (`src/projects/photo-validation.ts`), an in-memory photo store that
preserves the original Blob byte-for-byte and manages object-URL lifecycle
(`src/projects/photo-store.ts`), and an adjustable rectangular sign-area selection with mouse, touch
and keyboard support (`src/components/workflow/sign-area-picker.tsx`). The selection is stored
normalised (fractions of the natural image size) in the customer draft, which moved to version 2
(version 1 drafts are migrated on parse). The photo never leaves the browser; the placement shown is
schematic and labelled as such — no AI compositing and no fabrication accuracy is claimed.

**Authentication milestone (implemented):** shared Admin/Pro authentication with server-enforced
roles. The app is a static export (`output: "export"`) served by Cloudflare Pages; the auth API
runs as Pages Functions (`functions/api/auth/**`) backed by Cloudflare D1 only. One shared login
page serves both roles; the role decides the destination (Admin Space or Professional Studio).
Passwords use a browser-side PBKDF2 pre-hash (600,000 iterations, per-account salt) plus a
server-side pepper — the raw password never reaches the server. Sessions are `__Host-` cookies
with sliding expiry and a hard cap; account management (invite, suspend, restore, revoke) is
admin-only; every security-relevant action is audited; login and setup are rate-limited. The
customer space stays free and account-free. Section 11 has the full design; `docs/ROADMAP.md`
has the review and the implementation record.

**Visual mockup milestone (implemented):** a basic visual mockup rendered entirely in the browser
(`src/projects/mockup-render.ts`): the sign — business name and tagline — painted in the selected
template's style and colours (`mockup` descriptors on the catalogue entries) and placed flat,
axis-aligned inside the marked area on the photo. There is no perspective transform, no
environmental lighting and no cast shadows; the panel (`src/components/workflow/mockup-panel.tsx`)
labels the result as a basic visual mockup that is not fabrication-ready, and offers a PNG download
(the `blob:` canvas is same-origin, so it is not tainted). Rendering is user-initiated and throttled
(one render per second, output capped at 1600 px) — performance limits, not quotas: browsing
templates and editing text and colours keep working at all times. The photo and the mockup never
leave the browser; no AI provider is involved (see `docs/ROADMAP.md` for the gated AI approach and
the enforceable-limits framework defined before any provider).

**Not implemented (planned):** AI generation and revision requests; editable 2D
design, genuine 3D geometry, materials, LED layout, mounting, technical drawings; AI-powered
realistic mockups (perspective, lighting, shadows — gated, see the roadmap);
project persistence; fabrication exports; and any deployment configuration.

No payment features, no API keys, no external services, and no Vercel configuration exist yet.

**Demonstration honesty:** the live preview is a deterministic style composition of the typed text,
rendered locally in the browser. It is not AI-generated imagery and must never be described as a
technically accurate fabrication model. Controls appear only where they work: the planned step 4 of the
customer workflow and the professional tools have labels, not buttons.

## 2. Stack

| Concern                  | Choice                                               | Version        | Notes                                                                               |
| ------------------------ | ---------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| Framework                | Next.js, App Router, pinned exactly                  | 16.4.0         | Static generation for locale pages. Uses experimental `globalNotFound` (section 4). |
| UI                       | React                                                | 19.3.0         |                                                                                     |
| Language                 | TypeScript, `strict` plus `noUncheckedIndexedAccess` | 6.0.3          |                                                                                     |
| Styling                  | CSS Modules over CSS custom properties               | built in       | Logical properties throughout, for RTL. No utility framework.                       |
| Unit and component tests | Vitest with Testing Library                          | 4.1.11, 16.3.3 | DOM environment: happy-dom 20.14.6.                                                 |
| End-to-end tests         | Playwright Test with Chromium                        | 1.64.0         | Runs the production build at three widths. Section 7.                               |
| Linting                  | ESLint flat config with `eslint-config-next`         | 9.39.5, 16.4.0 | See section 8 for the ESLint 9 constraint.                                          |
| Formatting               | Prettier                                             | 3.9.9          |                                                                                     |
| Package manager          | npm, with a committed `package-lock.json`            | lockfile v3    |                                                                                     |
| Node runtime             | Node.js 22 (`.nvmrc`), `engines.node >= 20.9.0`      |                |                                                                                     |
| Hosting (target)         | Cloudflare Pages: static export + Pages Functions    |                | `wrangler.toml`, `public/_headers`, `public/_redirects`, `public/_routes.json`      |
| Functions runtime        | Cloudflare Workers (Pages Functions) + D1 (SQLite)   | wrangler 4.149 | Only `/api/*` invokes Functions; page views never burn the Workers quota.           |
| Workers types            | `@cloudflare/workers-types` (devDependency)          | 5.2026…        | Separate TS program: `functions/tsconfig.json` (Workers types, not the DOM lib).    |
| CI                       | GitHub Actions: `npm run check`, plus a browser job  |                | `.github/workflows/ci.yml`; the browser job runs against `wrangler pages dev`       |

**Why Next.js:** the target deployment is Cloudflare Pages, which serves the static export
(`output: "export"`) natively and runs the dynamic parts (the auth API) as Pages Functions. The App
Router gives server-rendered, statically generated pages with `lang` and `dir` on the server, which
matters for Arabic. Server-side code (Pages Functions) is the place for secrets and AI calls, so keys
never reach the browser.

**Why `next` is pinned exactly:** the not-found design uses `experimental.globalNotFound`, which is
experimental in 16.4 (section 4). A caret range could move that feature under the app without a review.
Upgrading Next.js means re-checking section 4, the smoke test and the browser tests.

**Why no i18n library:** three locales with one message tree each is small. A typed dictionary
(`src/i18n/messages/*.ts`, where `fr` and `ar` must satisfy the `en` shape) gives compile-time key
checking and a test for parity, without a runtime dependency.

**Why CSS Modules and tokens, not Tailwind:** the design system is the product's visual identity,
and tokens with a contrast test give that identity an automated check. Tailwind would add a second
source of design values.

**Why no web font:** `next/font/google` fetches fonts at build time from `fonts.googleapis.com`. That
host is not reachable from the build environment used so far, and an external font adds a dependency.
The UI uses system font stacks, with a dedicated Arabic stack.

**Why happy-dom, not jsdom:** the test environment is happy-dom. jsdom's optional `canvas` peer
dependency made `npm install` crash with `Cannot read properties of null (reading 'edgesOut')` under
npm 10.9.8 (see section 8). The lockfile was produced with npm 11.21.0. It installs cleanly with npm 10
too, and CI uses `npm ci` with the npm version bundled with Node 22.

## 3. Repository layout

```
src/
  app/
    [locale]/            Locale routes. The layout validates the locale and renders AppDocument.
      layout.tsx         Static params, metadata, and AppDocument for each locale.
      page.tsx           Home: the product landing page.
      create/page.tsx    Customer flow: the working local style demo (steps 1–3).
      pro/page.tsx       Professional entry point: planned tools, labelled.
      login/page.tsx     The one shared login page (Milestone 5).
      admin/page.tsx     Admin Space: account management (Milestone 5).
      studio/page.tsx    Professional Studio: signed-in workspace shell (Milestone 5).
      setup/page.tsx     One-time, unlinked initial admin setup (Milestone 5).
      set-password/      Invitation landing page (?token=…) (Milestone 5).
    global-not-found.tsx The exported 404 document: three locale variants + detection script.
    icon.svg             Favicon.
  components/
    app-shell/           AppDocument (html, body, shell), header, navigation, language switcher.
    auth/                Login/setup/set-password forms, admin dashboard, studio panel, NavAuth.
    home/                Landing page sections: hero, examples gallery, workflow summary, pro teaser.
    workflow/            Customer journey: workflow steps, the live template demo (template picker,
                         colour picker, storefront photo panel, sign preview, visual mockup
                         panel), the create view.
    pro/                 Professional entry point view.
    not-found/           Content of the 404 page (one variant per locale).
    ui/                  Button, Badge, Card, icons.
  i18n/                  Locale config, typed message dictionaries, path helpers.
  lib/                   Small shared helpers: cx, password (browser pre-hash), auth-client.
  projects/
    photo-validation.ts  Magic-byte and cap checks for uploaded photos.
    photo-store.ts       In-memory original-photo store, object-URL lifecycle, intake pipeline.
    mockup-render.ts     Client-side flat visual-mockup renderer (canvas) and PNG export.
  styles/                Design tokens, global CSS, and tests that enforce tokens and RTL rules.
  templates/
    catalogue.ts         The ten sign templates: ids, layouts, colour slots, mockup styles.
    palette.ts           The named colour palette (WCAG-checked) and slot helpers.
    draft.ts             The serialisable CustomerDraft (v2): versioning with v1 migration, photo
                         metadata and normalised selection.
    types.ts             Template, layout, colour, photo, selection and mockup-style types.
  test/                  Vitest setup.
functions/               Pages Functions (the auth API) — a separate TS program (section 11).
  env.d.ts               Env bindings (DB, SETUP_SECRET, PASSWORD_PEPPER, rate-limit knobs).
  schema.sql             The D1 schema: accounts, sessions, account_tokens, rate_limits, audit_log.
  lib/                   http, errors, i18n, timing, cookies, origin, password, session,
                         ratelimit, store, guard.
  api/auth/              prelogin, login, logout, me, setup, set-password, accounts (+ [id]/…).
  test/                  node:sqlite D1 adapter + handler-level tests against the real schema.
public/                  Static assets, plus the Pages files: _headers, _redirects, _routes.json,
                         not-found-locale.js (404 locale detection).
wrangler.toml            Cloudflare Pages project config (placeholder D1 database_id).
e2e/                     Browser tests (Playwright) against the production export.
  fixtures/seed.sql      Local test fixture: one seeded admin (test-only values).
scripts/smoke-test.mjs   Starts `npm run test:server` (wrangler) and checks HTTP + auth API.
scripts/test-env.mjs     Writes the gitignored .dev.vars with deterministic TEST-ONLY secrets.
playwright.config.ts     Browser test projects at 360, 768 and 1280 px.
docs/                    Architecture and design-system documents.
```

Tests are colocated with the code they cover (`*.test.ts(x)`).

## 4. Routing and rendering

**Routes**

- `/` redirects (307) to `/fr` (`public/_redirects` on Pages). The target comes from `defaultLocale`.
- `/fr`, `/en` and `/ar` are statically generated (`generateStaticParams`) and exported as static
  files (`out/fr.html`, …). `dynamicParams = false` means that only these locales reach a locale route.
- The product routes `/[locale]/create` and `/[locale]/pro` are exported the same way.
- Milestone 5 added the auth routes, also statically exported: `/[locale]/login` (one shared login
  page), `/[locale]/admin` (Admin Space), `/[locale]/studio` (Professional Studio),
  `/[locale]/setup` (one-time, unlinked, noindex), `/[locale]/set-password` (invitation landing,
  noindex). They are real pages; the access control itself is enforced by the API (section 11),
  because static HTML cannot keep secrets.
- Every other URL is unmatched and serves the exported `404.html` with HTTP 404. That covers unknown
  locales (`/de`), unknown paths under a valid locale (`/fr/does-not-exist`), and planned sections
  that are not built yet (`/fr/projects`).
- A trailing slash on a locale URL redirects (308) to the URL without it, so `/fr/` goes to `/fr`.
- `/api/*` is the only path that invokes Pages Functions (`public/_routes.json`); everything else is
  served from the static export and never consumes the Workers request quota.

**Documents**

- There is no root `app/layout.tsx`. `src/components/app-shell/app-document.tsx` renders `<html lang dir>`,
  the body and the app shell. The locale layout and the global not-found page both render through it,
  so they cannot drift apart.
- `lang` and `dir` come from the locale on the server, so the first byte says which language the page
  is in. Arabic gets `dir="rtl"`.

**Unknown URLs and the 404 page**

In Next.js 16.4, a 404 for a URL that no locale route matches cannot carry that locale's `lang`
through the usual mechanisms:

- A `not-found` file inside a locale route is rendered on the client. For a request that fails before
  streaming, the server sends an empty `<html id="__next_error__">` with status 404 and no `lang`. The
  text appears only after JavaScript runs. This was seen in production and in dev mode.
- A root `app/not-found.tsx` is wrapped in Next.js's own document, so its `<html lang>` is dropped.
- Route-group root layouts, one per locale, serve unmatched URLs with the default document and no `lang`.

What works is `experimental.globalNotFound`. The Next.js 16.4 documentation bundled with the package
describes it for root layouts defined by top-level dynamic segments, which is this app's case.
`app/global-not-found.tsx` renders a complete document with status 404, so the status, `lang`, `dir`,
copy and `noindex` are all in the server HTML.

That page has no params and does not run layouts, so it cannot read the locale from the URL at
render time. Before Milestone 5, `src/proxy.ts` solved this with an `x-signcraft-locale` request
header. A proxy cannot run on static hosting, so the exported 404 document now solves it in the
browser instead (see below).

**The exported 404 document (Milestone 5, static hosting)**

Pages serves one static `404.html` for every unknown URL. `app/global-not-found.tsx` renders it in
the default locale at build time, with all three locale variants embedded: the default variant is
visible, the other two carry `hidden` and their own `data-notfound-locale` / `data-notfound-title`
attributes. `public/not-found-locale.js` (loaded with `defer`) reads the path, finds the locale
segment, sets `lang`/`dir` on `<html>`, unhides the matching variant and swaps `document.title`.
Everything is data-driven; no user input is injected. The response has status 404, one `noindex`
meta (added by Next.js for not-found documents), the skip link, the banner and the language
switcher.

- The e2e 404 contract is preserved: it asserts the rendered `lang`/`dir`, the locale's heading, the
  home link, the switcher and no console errors — all produced after the script runs.
- **Honest regression (approved in the Milestone 5 review):** with JavaScript disabled, a 404 page
  shows the default locale. Static hosting cannot vary one document per URL without per-request
  Functions, which would burn the Workers quota.
- A client-side navigation between two unknown URLs makes the router request the target's RSC
  payload (`<path>.txt`); on the static export that is the 404 document, so the browser logs the
  expected 404 resource error. The e2e error tracker allows exactly the `.txt` payload of the
  expected-404 paths, as its documentation always intended.

**Static rendering**

- Every page, including the 404 document, is a static file in `out/` (`next build` with
  `output: "export"`). The smoke test checks the exported files exist and serves them through
  `wrangler pages dev`, the same stack Pages uses.
- The security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy`) moved from
  `next.config.ts` `headers()` to `public/_headers`; the `/` → `/fr` redirect moved from
  `redirects()` to `public/_redirects`. Both are applied by Pages (and by `wrangler pages dev`).
- `next/image` optimisation needs a server, so `images.unoptimized: true` is set for the export.

**Approaches compared**

| Approach                                                                           | What happened                                                                                                                      | Decision                      |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Root `app/not-found.tsx` with its own `<html lang>`                                | Next.js drops the attributes. The 404 has no `lang`.                                                                               | Rejected                      |
| Localised `not-found.tsx` in `[locale]`, with a catch-all that calls `notFound()`  | Empty `__next_error__` shell in the server response. The UI is drawn on the client only.                                           | Rejected                      |
| Same, with `loading.tsx` on the segment                                            | The server response contains only the loading fallback text.                                                                       | Rejected                      |
| One root layout per locale (route groups)                                          | Unmatched URLs get the default document with no `lang`.                                                                            | Rejected                      |
| Proxy rewrite of unknown URLs to a not-found route                                 | Works; see the note below. The rewrite sets the 404 status and the target page is server-rendered with the right `lang` and `dir`. | Rejected (validated fallback) |
| Read the locale from request headers in the root layout                            | Reading request headers opts the route into dynamic rendering, so every locale page would become dynamic.                          | Rejected                      |
| `experimental.globalNotFound` + proxy header (pre-Milestone 5)                     | Server-rendered 404 with the right `lang`, `dir` and copy, at the cost of a proxy on every request.                                | Replaced by static hosting    |
| `experimental.globalNotFound` + per-request Functions for 404s                     | Correct per-URL `lang` without JavaScript, but every 404 burns the Workers request quota.                                          | Rejected                      |
| `experimental.globalNotFound` + one static 404.html with a locale-detection script | Correct `lang`/`dir`/copy with JavaScript, default locale without. One static file, no quota cost.                                 | **Chosen (Milestone 5)**      |

**Note on the rewrite alternative.** Tests on Next.js 16.4.0 show that
`NextResponse.rewrite(url, { status: 404 })` does set the 404 status on the rewritten response. The
rewritten page is server-rendered with the right `lang` and `dir`, `/fr`, `/en` and `/ar` stay
static, a client-supplied `x-signcraft-locale` header is ignored, and client-side navigation keeps
the requested URL. The approach is still rejected because the proxy must then keep its own list of
known routes: a forgotten entry turns a live route, including the `/` redirect, into a 404, and a
removed route falls back to Next.js's default document with no `lang`. The rewrite target also needs
its own root layout, and `noindex` must be added by hand. It is the validated fallback if
`experimental.globalNotFound` ever changes.

**Limitations of this approach**

- `experimental.globalNotFound` is experimental in Next.js 16.4, and the build prints "Experiments (use
  with caution)". Upgrading Next.js needs a review of this section.
- Only unmatched URLs use the global page. A `notFound()` call inside a locale route still gives the
  empty shell described above. New routes must not rely on `notFound()` in nested segments. Keep the
  valid values in `generateStaticParams` with `dynamicParams = false`, so that unknown values are
  unmatched and reach the global page.
- Without JavaScript, a 404 shows the default locale (approved regression, above).
- The 404 document contains the copy of all three locales, so it is slightly larger than a
  single-locale document. It is one static file, cached like any other.

## 5. Localisation

- Locales: `fr` (default), `en`, `ar` (right-to-left). Configured in `src/i18n/config.ts`.
- Each dictionary is typed against `en`. Missing or extra keys fail `tsc`.
- Tests enforce that `fr` and `ar` have exactly the same keys as `en`, that no message is empty, and
  that every Arabic message contains Arabic script (except the product name).
- The language switcher links to the same page in each language (`replaceLocaleInPath`), so it works
  without JavaScript.
- Layout uses logical CSS properties (`margin-inline-start`, `inset-inline-start`, `border-inline-end`)
  and never `left` or `right`. `src/styles/rtl-guard.test.ts` fails the build if a physical property
  appears in any stylesheet.
- Off-canvas motion uses `--inline-direction` (1 for LTR, -1 for RTL), so the drawer slides out of the
  correct edge.

**Default locale: French.** This follows the order in the brief. It is a product decision and is easy
to change in `src/i18n/config.ts`.

## 6. Application shell and navigation

- Below 64rem (1024px): sticky header with a menu button. The navigation is an off-canvas drawer, and
  a backdrop covers the content.
- At 64rem and above: a sticky sidebar next to the content.
- The language switcher sits in the header from 40rem up. Below 40rem the header holds only the menu
  button and the brand, and the switcher moves to the foot of the drawer under a visible label. Three
  native language names beside the menu do not fit a 320px screen.
- The drawer uses `aria-expanded` and `aria-controls`. Escape closes it and returns focus to the menu
  button when focus was inside it. Clicking the backdrop closes it. Navigating closes it. While open on
  small screens, page scrolling is locked.
- While closed, the drawer uses `visibility: hidden`, so its links leave the tab order and the
  accessibility tree.
- The drawer is a disclosure, not a modal dialog, so it does not trap focus. The backdrop is
  `aria-hidden` and is only a pointer target that closes the drawer. It is not reachable by keyboard.
- A skip link goes to `#main-content`, which is focusable (`tabIndex={-1}`) so that focus lands on
  the content.
- Planned sections (Projects, 2D design, 3D geometry, AI mockups, Exports) appear as labelled
  "Planned" rows, not as links.

## 7. Quality gates

`npm run check` runs, in order:

1. `format:check`: Prettier.
2. `lint`: ESLint with Next's core-web-vitals and TypeScript rules, plus Prettier compatibility.
3. `typecheck`: `next typegen` (which creates the route types that `next-env.d.ts` references), then
   `tsc --noEmit`.
4. `test`: Vitest. Covers i18n parity and rules, the display-locale rules, contrast of every text colour
   pair against WCAG AA (4.5:1 text, 3:1 for focus and control boundaries), the RTL physical-property
   guard, component behaviour (shell, drawer, language switching, the landing page, the working demo and
   the professional entry point — each without fake controls — and the 404 view), and UI primitives.
5. `build`: `next build`.
6. `test:smoke`: runs the production server and checks the redirects, `lang` and `dir` on each locale,
   one `<h1>`, the skip link, security headers, no `X-Powered-By`, no links to unbuilt sections, Arabic
   heading text, the static prerendering headers on the locale pages, and for every unknown URL: 404,
   `lang` and `dir`, `noindex`, one non-empty heading in the right script, and the English switcher
   keeping the same path. A `x-signcraft-locale` header sent by the client is ignored.

CI runs this command on every push and pull request.

**Browser tests** (`npm run test:e2e`) need a Chromium binary, so they are a separate command. Playwright
starts `next start` on the production build itself, and it always starts a fresh server. The tests run at
360 px (touch), 768 px and 1280 px:

- Unknown URLs: status 404, `lang`, `dir`, the heading in the page's language, `noindex`, the banner, no
  horizontal overflow, and no console errors. The only error allowed is the 404 of that unknown URL and
  its navigation request. The copy is read from the same dictionaries the app uses.
- The 404 page links back to the home page of its locale, and the language switcher keeps the same path.
- The home pages in French, English and Arabic: status 200, `lang`, `dir`, heading, no horizontal
  overflow, no console errors.
- `/` and `/fr/` redirect to `/fr`. The switcher changes language and direction. The skip link moves
  focus. On narrow screens the drawer opens from the menu button, and Escape closes it and returns focus.
  On wide screens the sidebar is shown and the menu button is hidden.

Locally, set `E2E_CHROMIUM_PATH` to an installed Chromium if `npx playwright install chromium` cannot
download the browser. The CI browser job installs Chromium with `npx playwright install --with-deps
chromium`, runs `npm run build`, and then runs `npm run test:e2e`.

## 8. Constraints and known issues

These were found during the foundation build and the not-found work. Each one has a decision or a next step.

1. **Unknown URLs depend on an experimental Next.js feature.** The 404 page uses
   `experimental.globalNotFound`; the exported 404 document detects the locale in the browser
   (section 4). Section 4 explains why the alternatives were rejected. The version is pinned exactly.
   Revisit this when Next.js stabilises the feature or changes it. Until then, every Next.js upgrade
   needs the smoke and browser tests run first.
2. **ESLint 9.39.5 is end-of-life according to ESLint's own deprecation notice.** ESLint 10.12.0 is
   released, but `eslint-config-next@16.4.0` depends on `eslint-plugin-react` (peer `eslint` up to 9.7),
   `eslint-plugin-jsx-a11y` (peer up to 9) and `eslint-plugin-import` (peer up to 9). Upgrading means
   waiting for those plugins or dropping `eslint-config-next`. Tracked for a later milestone.
3. **jsdom is not used.** `vitest` declares `jsdom` as an optional peer, and jsdom declares `canvas`
   optionally. Under npm 10.9.8, `npm install` crashed during peer resolution with
   `Cannot read properties of null (reading 'edgesOut')`. The same install succeeded under npm 11.21.0.
   happy-dom avoids the problem, and it has no native peer.
4. **Browser checks run in CI.** `e2e/` runs in the `browser` job with Playwright's own Chromium. Where
   that download is blocked, `E2E_CHROMIUM_PATH` points the same tests at an installed Chromium.
5. **`unrs-resolver` postinstall is skipped by npm 11 (a warning).** The package's native binding ships
   as an optional dependency and loads correctly, so no action is needed.
6. **Smoke test and Windows.** `scripts/smoke-test.mjs` stops the server with POSIX process groups. It
   runs on Linux and macOS, including CI. It starts `npm run test:server` (wrangler), so it also needs
   the wrangler devDependency and a POSIX shell.
7. **`npm audit` reports five high-severity findings, all in the dev-only linting chain.** They come
   from `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces@3.0.3`
   (GHSA-vfj7-8cjw-p6xm, stack exhaustion through deeply nested patterns). The advisory lists no patched
   version, and `braces@3.0.3` is still the latest release. `npm audit --omit=dev` reports zero findings,
   so nothing that ships to users is affected. The linter only globs patterns from this repository's
   own configuration. npm's suggested fix is a major downgrade of `eslint-config-next` to 14.x, which
   was not applied. Revisit when `braces` publishes a fix or the chain changes.
8. **The French and Arabic 404 copy is drafted, not reviewed.** A native speaker should review it.
9. **GitHub moves `ubuntu-latest` to Ubuntu 26 on 19 October 2026.** The browser job installs Chromium
   with `--with-deps`, which depends on the runner's packages. Check that job after the change.
10. **The no-JS 404 shows the default locale.** Approved in the Milestone 5 review: static hosting serves
    one 404 document, and the locale-detection script needs JavaScript. Every rendered-404 assertion in
    the browser tests still passes; only the no-JS experience is reduced.
11. **No cron on Pages Functions.** Expired sessions, tokens and rate-limit rows are purged lazily on
    access; logout, suspend and revoke delete sessions and tokens eagerly. A cron trigger would need a
    Workers deployment (Pages Functions are request-driven only), which is out of scope.
12. **CSP is deferred.** Next.js App Router hydration requires inline `__next_f.push` scripts, so a
    strict CSP would need `script-src 'unsafe-inline'`, which guts XSS protection. The real mitigations
    are the HttpOnly session cookie, no `dangerouslySetInnerHTML` anywhere in the app, and the static,
    reviewed locale-detection script in `public/`. Revisit when Next.js supports nonced inline scripts.
13. **Free-tier ceilings (Cloudflare, verified against official docs).** Workers free: 100,000
    requests/day, 10 ms CPU per request (Error 1027 on quota exhaustion, 1102 on CPU). D1 free: 5 M rows
    read/day, 100 k rows written/day, errors until the 00:00 UTC reset. Only the auth API is affected —
    the static site keeps serving. The single free WAF edge rate-limiting rule on `/api/auth/*` applies
    only when serving from a Cloudflare-proxied custom domain, not on `*.pages.dev`; the in-app D1 rate
    limiter is the guaranteed control. No paid fallback ever.
14. **The browser pre-hash is replayable.** `clientHash` is site-specific (per-account salt + server
    pepper) and travels only over TLS, but a captured client hash can be replayed to log in. The mitigations
    are the password policy (12-character minimum, enforced in the UI), rate limiting, and the short
    session lifetime. Weakening the 600,000-iteration work factor to fit the 10 ms CPU limit was
    considered and rejected (see `docs/ROADMAP.md`, Milestone 5 security review).
15. **No email delivery.** Invitation and password-reset links are copied by the admin and shared
    manually. Admin account recovery is the documented break-glass procedure (direct D1 access), because
    there is no email to recover through.
16. **Nothing is deployed.** `wrangler.toml` has a placeholder `database_id` and no secrets. Deployment
    is a separate, owner-approved step (checklist in `docs/ROADMAP.md`, Milestone 5, migration note 6).

## 9. Planned product architecture

These are design intentions. None of them is implemented yet.

- **2D design:** a versioned JSON document model (shapes, text, images, layers, real millimetre units),
  rendered with SVG or canvas. Editing commands act on the document, so undo and redo and persistence
  use the same data.
- **3D geometry:** three.js, loaded only on 3D routes, so the rest of the app stays small. Models are
  built from the document (real extrusions of letter outlines and panels), not decorative meshes.
- **AI mockups:** generated only by server route handlers. Keys come from server environment
  variables and never reach the client. Output is labelled illustrative and does not claim real
  dimensions.
- **Persistence:** local-first in IndexedDB, with a `schemaVersion` field on every stored document and a
  migration function for each version. Accounts and server storage now exist for the Admin/Professional
  spaces (Milestone 5, D1); customer drafts stay device-local until the project-transfer milestone (M6).
- **Exports:** generated from the same document and geometry data. Each export states its content and
  its accuracy. An export never claims accuracy the data cannot support.
- **Deployment:** Cloudflare Pages (static export + Pages Functions + D1), configured in `wrangler.toml`
  with a placeholder database id. Nothing is deployed yet; deployment is a separate owner-approved step
  (`docs/ROADMAP.md`, Milestone 5, migration note 6).

## 10. Next milestone

Milestone 6 (see `docs/ROADMAP.md`): project transfer into the Professional Studio and the first genuine
pro editing tools (dimensions, 2D layout). Milestone 5 delivered the accounts that milestone needs.
Keep the unbuilt modules marked "Planned" until each one works and has been tested.

## 11. Authentication and access control (Milestone 5)

The access system for the Admin Space and the Professional Studio. The customer space is untouched:
no accounts, no login, fully free. The design, the security review and the implementation record are
in `docs/ROADMAP.md` (Milestone 5); this section records the architecture.

**Deployment shape.** The app is a static export (`output: "export"`) served by Cloudflare Pages. The
dynamic part is the auth API: Pages Functions in `functions/api/auth/**`, invoked only for `/api/*`
(`public/_routes.json`), backed by one D1 database (`wrangler.toml`, binding `DB`). KV was evaluated
and rejected (1,000 writes/day is too tight for sessions and rate limits); the full-SSR adapters were
rejected (page views would burn the 100k/day Workers quota and risk the 10 ms CPU limit); a self-hosted
Node server was rejected (not free). Zero mandatory operating costs.

**Data model (`functions/schema.sql`).**

| Table            | Contents                                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`       | id, email (unique, case-insensitive), role (`admin`\|`pro`), status (`invited`\|`active`\|`suspended`\|`revoked`), per-account salt, `password_hash` (NULL until set), timestamps, `last_login_at`. |
| `sessions`       | id, account_id, created_at, `expires_at` (sliding), `hard_expires_at` (absolute cap).                                                                                                               |
| `account_tokens` | `token_hash` (SHA-256 of the one-time token), account_id, purpose (`set-password`), created_at, `expires_at` (1 h), `used_at`.                                                                      |
| `rate_limits`    | key (`login:ip:*`, `login:email:*`, `setup:ip:*`, `token:ip:*`), window_start, failures.                                                                                                            |
| `audit_log`      | actor, action, target, detail, ip, created_at — every security-relevant action.                                                                                                                     |

**Password scheme (reviewed, not weakened for the CPU limit).** The browser derives
`clientHash = base64url(PBKDF2-SHA256(NFKC(password), salt, 600 000 iterations, 256 bits))` with the
account's salt (`src/lib/password.ts`) and sends only that. The server stores
`sha256hex(clientHash + "." + PASSWORD_PEPPER)` (`functions/lib/password.ts`). 600,000 server-side
iterations would cost ≈ 113 ms CPU — 11× the 10 ms free-tier limit — so the work happens on the
visitor's device; a database-only leak cannot verify guesses offline because the pepper is a server
secret. Verification is a constant-time hex compare. Honest limitations: the client hash is replayable
(site-specific, TLS-protected), and the password policy (12-character minimum) is enforced in the UI
because the server never sees the raw password. The raw password never reaches the server.

**Endpoints (`functions/api/auth/`).** All responses are `Cache-Control: no-store` + `nosniff`;
error bodies are `{ error: { code, message } }` with the message localised via `x-signcraft-locale`
(our fetch wrapper sets it from the page locale) or `Accept-Language`, defaulting to French.

| Endpoint                         | Method | Auth         | Purpose                                                                                                                              |
| -------------------------------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/auth/prelogin`             | POST   | rate-limited | Returns the account's salt (a fixed dummy salt for unknown emails — no enumeration).                                                 |
| `/api/auth/login`                | POST   | rate-limited | Verifies the client hash; on success creates a session and sets the `__Host-` cookie. Dummy compare for unknown emails.              |
| `/api/auth/logout`               | POST   | session      | Deletes the session server-side, clears the cookie. Idempotent.                                                                      |
| `/api/auth/me`                   | GET    | —            | Session probe: `{ authenticated, account? }`. Never cached.                                                                          |
| `/api/auth/setup`                | POST   | setup secret | Two steps (salt, then create). Constant-time secret compare; atomic first-admin insert; 409 once an admin exists; per-IP rate limit. |
| `/api/auth/set-password`         | POST   | invite token | Two steps (salt, then set). Atomic single-use token consumption (1 h expiry); activates the account; auto-login.                     |
| `/api/auth/accounts`             | GET    | admin        | Account list (never includes salts or hashes).                                                                                       |
| `/api/auth/accounts`             | POST   | admin        | Invites a professional (role `pro` only — admins are never created through the API).                                                 |
| `/api/auth/accounts/:id/suspend` | POST   | admin        | Suspends: status + all sessions and tokens deleted. Self/admin protected.                                                            |
| `/api/auth/accounts/:id/restore` | POST   | admin        | Restores a suspended account to active.                                                                                              |
| `/api/auth/accounts/:id/revoke`  | POST   | admin        | Revokes: status + sessions/tokens deleted; login refused. Self/admin protected.                                                      |

**Sessions.** `__Host-sc_session` cookie: HttpOnly, Secure, SameSite=Lax, Path=/ (the `__Host-`
prefix requires exactly that). 7-day expiry with sliding renewal (when less than a day remains, the
expiry moves to now + 7 days) and a 30-day hard cap from creation, after which the session is deleted.
The database is authoritative; logout, suspend and revoke delete the session row server-side, so a
stolen cookie value stops working immediately. The client-side gates on `/admin` and `/studio` are UX
only — the API re-checks the session and role on every call.

**Request protection.** Mutations are POST-only and must pass `assertSameOrigin`: `Sec-Fetch-Site:
cross-site` is rejected, and a present `Origin` header must match the request's host and protocol
(SameSite=Lax cookies already block cross-site authenticated POSTs; these checks reject the request
itself). Rate limiting: 5 failures / 15 min per email-hash (and per token), 20 / 15 min per IP by
default (env-configurable), with an in-isolate memory fast-path and the D1 `rate_limits` table as the
cross-isolate backstop; a successful login clears both keys. Failed logins for unknown emails take the
same dummy-compare path as wrong passwords, so responses do not reveal whether an account exists.

**Break-glass and recovery.** No email service exists: invitation/reset links are copied by the admin
and shared manually. If the admin loses their password, recovery is the documented break-glass
procedure — direct D1 access to reset `password_hash` (or create a fresh token row) — because there is
no email to recover through. The one-time `/setup` page is the sanctioned way to create the first
admin and refuses (409) once one exists.

**Client (`src/lib/auth-client.ts`, `src/components/auth/`).** The fetch wrapper sends the page locale
and handles the localised error bodies. `NavAuth` in the header probes `/api/auth/me` on mount and on
every route change, shows Sign in / the role's space + Sign out, and leaves a gated page after
signing out. The forms orchestrate the two-step flows and pre-hash in the browser. All copy is in
fr/en/ar with correct RTL. The customer space never calls the API except the anonymous `me` probe.

**Testing.** Functions unit tests run the real handlers against the real `schema.sql` through a
`node:sqlite` D1 adapter (`functions/test/`) — password vectors, timing-safe compare, session
lifecycle and cookie attributes, role guards (pro → 403, anonymous → 401), suspend/restore/revoke,
token single-use, rate-limit lockout, cross-site rejection, audit rows. Component tests cover the
login form flow (mocked API), NavAuth states. The smoke test exercises the API over HTTP (seeded
admin login with a real PBKDF2 client hash, cookie attributes, `me`, admin list, logout, setup
refusal). `e2e/auth.spec.ts` covers the API flows and the browser flows per locale (incl. AR RTL),
the onboarding through a real invitation link, guards and redirects, rate limiting, and that the
customer space stays free. Local test values are deterministic and TEST-ONLY
(`scripts/test-env.mjs` → gitignored `.dev.vars`; `e2e/fixtures/seed.sql`); production secrets are set
per environment with `wrangler pages secret put` and are never committed.
