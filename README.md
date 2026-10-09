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

| Script                 | What it does                                                                      |
| ---------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`          | Development server with hot reload.                                               |
| `npm run build`        | Production build. Prerenders `/fr`, `/en` and `/ar`.                              |
| `npm start`            | Serves the production build. Run `npm run build` first.                           |
| `npm run lint`         | ESLint over the whole repository.                                                 |
| `npm run typecheck`    | Generates route types, then runs `tsc --noEmit`.                                  |
| `npm test`             | Unit and component tests (Vitest).                                                |
| `npm run test:watch`   | Tests in watch mode.                                                              |
| `npm run test:smoke`   | Starts the production server and checks real HTTP responses. Run the build first. |
| `npm run format`       | Formats the repository with Prettier.                                             |
| `npm run format:check` | Checks formatting without changing files.                                         |
| `npm run check`        | Everything above, in order: format, lint, typecheck, test, build, smoke.          |

CI runs `npm ci` and `npm run check` on every push and pull request
(`.github/workflows/ci.yml`).

## Languages

| Code | Language | Direction | Notes                         |
| ---- | -------- | --------- | ----------------------------- |
| `fr` | Français | LTR       | Default. `/` redirects here.  |
| `en` | English  | LTR       |                               |
| `ar` | العربية  | RTL       | Sets `dir="rtl"` on `<html>`. |

Messages live in `src/i18n/messages/`. `fr` and `ar` must have exactly the keys of `en`. The tests check
this.

## Project layout

```
src/app/[locale]/       Locale routes: layout (html lang/dir, app shell) and the home page
src/components/         app-shell, home, ui primitives
src/i18n/               locale configuration, typed dictionaries, path helpers
src/styles/             design tokens, global styles, token and RTL tests
scripts/smoke-test.mjs  production HTTP smoke test
docs/                   architecture and design system
```

## Known limitations

- Unknown URLs (outside a locale, or unmatched under one) use Next.js's default English 404 page, which
  has no `lang` attribute. The status code is correct. A localised 404 needs a design decision; see
  `docs/ARCHITECTURE.md`, section 8.
- ESLint 9 is end-of-life according to ESLint's notice. Upgrading is blocked by the plugin peer ranges of
  `eslint-config-next`.
- `npm audit` reports five high-severity findings in the dev-only linting chain (`braces` 3.0.3, no patched
  release yet). `npm audit --omit=dev` reports none. See `docs/ARCHITECTURE.md`, section 8.
- Browser checks ran once against the production build, in a headless Chromium outside this repository.
  They covered 146 checks at 320, 390, 768 and 1280 px in French, English and Arabic: overflow, drawer
  behaviour in both directions, keyboard use, language switching and console errors. They are not part of
  `npm run check`, because the repository has no end-to-end runner yet. See `docs/ARCHITECTURE.md`,
  section 8.

## Deployment

Not configured. There is no `vercel.json`, and nothing is deployed. Vercel deployment is a later
milestone.
