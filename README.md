# SignCraft AI Studio

Professional AI-assisted sign design studio. This repository currently holds the **foundation build**:
the application shell, responsive navigation, design system, French/English/Arabic (RTL)
localisation, automated checks and CI.

Not built yet: editable 2D design, 3D geometry, AI-assisted mockups, project persistence, exports and
deployment. The home page lists these as planned, and no control on the page does anything yet.

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

| Script                 | What it does                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Development server with hot reload.                                                                              |
| `npm run build`        | Production build. Prerenders `/fr`, `/en` and `/ar`.                                                             |
| `npm start`            | Serves the production build. Run `npm run build` first.                                                          |
| `npm run lint`         | ESLint over the whole repository.                                                                                |
| `npm run typecheck`    | Generates route types, then runs `tsc --noEmit`.                                                                 |
| `npm test`             | Unit and component tests (Vitest).                                                                               |
| `npm run test:watch`   | Tests in watch mode.                                                                                             |
| `npm run test:smoke`   | Starts the production server and checks real HTTP responses. Run the build first.                                |
| `npm run test:e2e`     | Browser tests (Playwright, Chromium) against the production build, at 360, 768 and 1280 px. Run the build first. |
| `npm run format`       | Formats the repository with Prettier.                                                                            |
| `npm run format:check` | Checks formatting without changing files.                                                                        |
| `npm run check`        | Everything above, in order: format, lint, typecheck, test, build, smoke.                                         |

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
src/app/[locale]/       Locale routes: layout (html lang/dir, app shell) and the home page
src/app/global-not-found.tsx  The 404 page for every URL no route matches
src/proxy.ts            Stores the display locale of each request for the 404 page
src/components/         app-shell (incl. AppDocument), home, not-found, ui primitives
src/i18n/               locale configuration, typed dictionaries, path helpers
src/styles/             design tokens, global styles, token and RTL tests
e2e/                    browser tests (Playwright)
scripts/smoke-test.mjs  production HTTP smoke test
docs/                   architecture and design system
```

## Known limitations

- The localised 404 page uses `experimental.globalNotFound` in Next.js 16.4, so `next` is pinned to
  16.4.0 exactly. The 404 page is rendered per request, while the locale pages stay static. See
  `docs/ARCHITECTURE.md`, sections 4 and 8.
- ESLint 9 is end-of-life according to ESLint's notice. Upgrading is blocked by the plugin peer ranges of
  `eslint-config-next`.
- `npm audit` reports five high-severity findings in the dev-only linting chain (`braces` 3.0.3, no patched
  release yet). `npm audit --omit=dev` reports none. See `docs/ARCHITECTURE.md`, section 8.
- Browser tests run in CI, not in `npm run check`, because they need a Chromium binary. They cover the
  locale pages and the 404 pages at 360, 768 and 1280 px. They do not replace a review by a native speaker
  of the French and Arabic copy, which is still a draft. See `docs/ARCHITECTURE.md`, section 8.

## Deployment

Not configured. There is no `vercel.json`, and nothing is deployed. Vercel deployment is a later
milestone.
