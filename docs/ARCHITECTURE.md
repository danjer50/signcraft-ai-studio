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

| Concern                  | Choice                                               | Version        | Notes                                                             |
| ------------------------ | ---------------------------------------------------- | -------------- | ----------------------------------------------------------------- |
| Framework                | Next.js, App Router                                  | 16.4.0         | Static generation for locale pages. Server components by default. |
| UI                       | React                                                | 19.3.0         |                                                                   |
| Language                 | TypeScript, `strict` plus `noUncheckedIndexedAccess` | 6.0.3          |                                                                   |
| Styling                  | CSS Modules over CSS custom properties               | built in       | Logical properties throughout, for RTL. No utility framework.     |
| Unit and component tests | Vitest with Testing Library                          | 4.1.11, 16.3.3 | DOM environment: happy-dom 20.14.6.                               |
| Linting                  | ESLint flat config with `eslint-config-next`         | 9.39.5, 16.4.0 | See section 8 for the ESLint 9 constraint.                        |
| Formatting               | Prettier                                             | 3.9.9          |                                                                   |
| Package manager          | npm, with a committed `package-lock.json`            | lockfile v3    |                                                                   |
| Node runtime             | Node.js 22 (`.nvmrc`), `engines.node >= 20.9.0`      |                |                                                                   |
| CI                       | GitHub Actions: `npm ci` then `npm run check`        |                | `.github/workflows/ci.yml`                                        |

**Why Next.js:** the target deployment is Vercel, which Next.js serves natively. The App Router gives
server-rendered, statically generated pages with `lang` and `dir` on the server, which matters for
Arabic. Server route handlers are the planned place for AI calls, so keys never reach the browser.

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
    [locale]/            Locale-scoped routes. Its layout owns <html lang dir> and the app shell.
      layout.tsx         Validates the locale, sets metadata, renders <html> and <AppShell>.
      page.tsx           Home: foundation status page.
    icon.svg             Favicon.
  components/
    app-shell/           Header, navigation (sidebar on desktop, drawer on mobile), language switcher.
    home/                Foundation status page content.
    ui/                  Button, Badge, Card, icons.
  i18n/                  Locale config, typed message dictionaries, path helpers.
  lib/                   Small shared helpers (cx).
  styles/                Design tokens, global CSS, and tests that enforce tokens and RTL rules.
  test/                  Vitest setup.
scripts/smoke-test.mjs   Starts `next start` and checks real HTTP responses.
docs/                    Architecture and design-system documents.
```

Tests are colocated with the code they cover (`*.test.ts(x)`).

## 4. Routing and rendering

- `/` redirects (307) to `/fr` (`next.config.ts`). The redirect target comes from `defaultLocale`.
- `/fr`, `/en`, `/ar` are statically generated (`generateStaticParams`). Other locale values return 404
  (`dynamicParams = false`).
- There is **no root `app/layout.tsx`**. The locale layout renders `<html lang dir>`, so the browser and
  screen readers get the correct language and direction from the first byte. Arabic gets `dir="rtl"`.
- The root layout could not be used for `lang`, because a single root layout cannot know the locale
  without per-request rendering. This choice has a consequence described in section 8: unknown URLs
  get Next.js's default 404.
- Only `fr`, `en` and `ar` are routable. Planned sections are not linked anywhere, so nothing points to
  a page that does not exist.

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
4. `test`: Vitest. Covers i18n parity and rules, contrast of every text colour pair against WCAG AA
   (4.5:1 text, 3:1 for focus and control boundaries), RTL physical-property guard, component
   behaviour (shell, drawer, language switching, home status page without fake controls), and UI
   primitives.
5. `build`: `next build`.
6. `test:smoke`: runs the production server and checks the redirect, `lang` and `dir` on each locale,
   one `<h1>`, the skip link, security headers, no `X-Powered-By`, no links to unbuilt sections,
   Arabic heading text, and 404 for unknown locales and paths.

CI runs the same command on every push and pull request.

## 8. Constraints and known issues

These were found during the foundation build. Each one has a decision or a next step.

1. **Unknown URLs get Next.js's default 404 page.** Without a root layout, Next.js renders not-found
   responses with its own `<html>` shell, and a locale layout's `<html lang dir>` is not used there. A
   localised `not-found` page and a catch-all route were tried and removed. Either the response had no
   content, or it lost the `lang` attribute. Result: the 404 status is correct, but the page is English
   and has no `lang`. A localised 404 needs a per-request locale (a proxy that sets a header,
   read by a root layout, which makes every page dynamic) or one root layout per locale (route groups).
   **Decision needed.**
2. **ESLint 9.39.5 is end-of-life according to ESLint's own deprecation notice.** ESLint 10.12.0 is
   released, but `eslint-config-next@16.4.0` depends on `eslint-plugin-react` (peer `eslint` up to 9.7),
   `eslint-plugin-jsx-a11y` (peer up to 9) and `eslint-plugin-import` (peer up to 9). Upgrading means
   waiting for those plugins or dropping `eslint-config-next`. Tracked for a later milestone.
3. **jsdom is not used.** `vitest` declares `jsdom` as an optional peer, and jsdom declares `canvas`
   optionally. Under npm 10.9.8, `npm install` crashed during peer resolution with
   `Cannot read properties of null (reading 'edgesOut')`. The same install succeeded under npm 11.21.0.
   happy-dom avoids the problem, and it has no native peer.
4. **Browser checks are not in the repository.** A headless Chromium from the npm package
   `@sparticuz/chromium` (153.0.0), driven by `playwright-core` (1.64.0), ran once outside the repository
   against the production server. The Playwright browser CDN is unreachable from here, so the binary came
   from npm. The run covered 146 checks: overflow at 320, 390, 768 and 1280 px; drawer geometry and
   behaviour in LTR and RTL; skip link and focus; language switching; console errors. Screenshots were
   reviewed by eye. Moving these checks into the repository needs an end-to-end runner in CI. That is
   planned for the next milestone.
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
