# Architecture

This document records the architecture of SignCraft AI Studio, the reasons for each choice,
the rejected alternatives, and the constraints found while building the foundation. It describes
what exists today and what is planned. Planned items are labelled as such.

## 1. Scope

**Foundation build (implemented):** application shell, responsive navigation, design tokens, a
small set of UI primitives, French/English/Arabic (RTL) localisation, automated checks, and CI.

**Not implemented (planned):** editable 2D design, genuine 3D geometry, AI-assisted mockups,
project persistence, exports, and any deployment configuration.

No payment features, no API keys, no external services, and no Vercel configuration exist yet.

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
| CI                       | GitHub Actions: `npm run check`, plus a browser job  |                | `.github/workflows/ci.yml`                                                          |

**Why Next.js:** the target deployment is Vercel, which Next.js serves natively. The App Router gives
server-rendered, statically generated pages with `lang` and `dir` on the server, which matters for
Arabic. Server route handlers are the planned place for AI calls, so keys never reach the browser.

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
      page.tsx           Home: foundation status page.
    global-not-found.tsx The 404 page for every URL that no route matches. Renders its own document.
    icon.svg             Favicon.
  components/
    app-shell/           AppDocument (html, body, shell), header, navigation, language switcher.
    home/                Foundation status page content.
    not-found/           Content of the 404 page.
    ui/                  Button, Badge, Card, icons.
  i18n/                  Locale config, typed message dictionaries, path helpers, display locale.
  lib/                   Small shared helpers (cx).
  proxy.ts               Stores the display locale of each request for the 404 page (section 4).
  styles/                Design tokens, global CSS, and tests that enforce tokens and RTL rules.
  test/                  Vitest setup.
e2e/                     Browser tests (Playwright) against the production build.
scripts/smoke-test.mjs   Starts `next start` and checks real HTTP responses.
playwright.config.ts     Browser test projects at 360, 768 and 1280 px.
docs/                    Architecture and design-system documents.
```

Tests are colocated with the code they cover (`*.test.ts(x)`).

## 4. Routing and rendering

**Routes**

- `/` redirects (307) to `/fr` (`next.config.ts`). The target comes from `defaultLocale`.
- `/fr`, `/en` and `/ar` are statically generated (`generateStaticParams`). `dynamicParams = false`
  means that only these locales reach a locale route.
- Every other URL is unmatched and renders `src/app/global-not-found.tsx` with HTTP 404. That covers
  unknown locales (`/de`), unknown paths under a valid locale (`/fr/does-not-exist`), and planned
  sections that are not built yet (`/fr/projects`).
- A trailing slash on a locale URL redirects (308) to the URL without it, so `/fr/` goes to `/fr`.

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

That page has no params and does not run layouts, so it cannot read the locale from the URL.
`src/proxy.ts` sets the request header `x-signcraft-locale` from the first path segment on every
request. A missing or unknown segment gives the default locale. The proxy overwrites the header on every
request, so a client cannot choose the language. Only the global not-found page reads the header.

**Static rendering after this change**

- `/fr`, `/en` and `/ar` are still prerendered (`●` in the build output). Their responses still carry
  `x-nextjs-prerender: 1` and `s-maxage`. The smoke test checks both.
- `/_not-found` changed from static (`○`) to dynamic (`ƒ`), because the 404 page reads a request header.
  No other route changed.
- The proxy runs before every page request, including static ones. It does not make them dynamic, but it
  adds work to every request.

Measured on localhost with `next start`, 100 sequential requests per URL. These are not hosting figures:

| URL                        | Before, median | After, median                |
| -------------------------- | -------------- | ---------------------------- |
| `/fr` (static)             | 1.7 ms         | 2.8 ms (with the proxy)      |
| `/fr/does-not-exist` (404) | 1.4 ms, static | 6.7 ms, rendered per request |

**Approaches compared**

| Approach                                                                          | What happened                                                                                             | Decision   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| Root `app/not-found.tsx` with its own `<html lang>`                               | Next.js drops the attributes. The 404 has no `lang`.                                                      | Rejected   |
| Localised `not-found.tsx` in `[locale]`, with a catch-all that calls `notFound()` | Empty `__next_error__` shell in the server response. The UI is drawn on the client only.                  | Rejected   |
| Same, with `loading.tsx` on the segment                                           | The server response contains only the loading fallback text.                                              | Rejected   |
| One root layout per locale (route groups)                                         | Unmatched URLs get the default document with no `lang`.                                                   | Rejected   |
| Proxy rewrite of unknown URLs to a not-found route                                | The rewritten response keeps the target's 200 status. The proxy cannot set 404 on a rewrite.              | Rejected   |
| Read the locale from request headers in the root layout                           | Reading request headers opts the route into dynamic rendering, so every locale page would become dynamic. | Rejected   |
| `experimental.globalNotFound` with a proxy header                                 | Server-rendered 404 with the right `lang`, `dir` and copy. Locale pages stay static.                      | **Chosen** |

**Limitations of this approach**

- `experimental.globalNotFound` is experimental in Next.js 16.4, and the build prints "Experiments (use
  with caution)". Upgrading Next.js needs a review of this section.
- Only unmatched URLs use the global page. A `notFound()` call inside a locale route still gives the
  empty shell described above. New routes must not rely on `notFound()` in nested segments. Keep the
  valid values in `generateStaticParams` with `dynamicParams = false`, so that unknown values are
  unmatched and reach the global page.
- The proxy runs on every request. On a hosting platform that bills per invocation, that is an extra
  cost. No deployment exists yet.

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
   guard, component behaviour (shell, drawer, language switching, the home status page without fake
   controls, the 404 view), and UI primitives.
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
   `experimental.globalNotFound`, and the proxy supplies the locale through a header. Section 4 explains
   why the alternatives were rejected. The version is pinned exactly. Revisit this when Next.js stabilises
   the feature or changes it. Until then, every Next.js upgrade needs the smoke and browser tests run first.
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
   runs on Linux and macOS, including CI.
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
10. **`next dev` prints `MaxListenersExceededWarning` once `proxy.ts` exists.** The warning appears in the
    dev server log for responses that pass through the proxy, including a proxy that does nothing. It does
    not appear with the same pages and no proxy, and it does not appear in `next start` or in the production
    build's logs. The pages behave the same in dev mode, and the browser console is clean there too. The
    cause is in Next.js 16.4.0, not in this code. Revisit when Next.js changes its proxy handling.

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
  migration function for each version. No accounts or server storage until the product needs them.
- **Exports:** generated from the same document and geometry data. Each export states its content and
  its accuracy. An export never claims accuracy the data cannot support.
- **Deployment:** a later milestone on Vercel, which needs its own configuration. None exists yet.

## 10. Next milestone

Build the projects shell: a local project list, create and open, and IndexedDB storage behind a
versioned repository interface, with tests for the migration path. Keep the unbuilt modules marked
"Planned" until each one works and has been tested.
