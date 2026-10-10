# Roadmap and product requirements

This document records the binding product requirements for all future work and the agreed order of
milestones. Milestones 1 and 2 are implemented (pull request #1). Later milestones are **proposals**:
none of them is started until explicitly approved.

## Milestone 2 — what shipped

- `src/templates/`: a structured catalogue of **ten** sign templates (neon glow, illuminated letters,
  3D metal lettering, minimal, projecting blade, awning band, window vinyl, lightbox plaque, marquee
  bulbs, floor totem), each with one or two named colour slots drawn from a WCAG-AA-checked palette.
- `/[locale]/create` now offers template selection and named colour swatches; the business name, the
  selected template's name and the colours all update the preview **instantly** (client state, CSS
  custom properties, `data-layout` treatments). Full fr/en/ar with RTL.
- A serialisable, versioned `CustomerDraft` (template + text + colours) with a strict parser — the
  seam for the future transfer into the Professional Studio. No persistence UI yet.
- The demo's honesty copy is unchanged: the preview is a local composition, not AI output and not a
  fabrication model; photo input, AI generation, revisions and all pro tools stay labelled Planned.

## Product requirements (constraints for every milestone)

### Customer space

- Free for all website visitors.
- No customer registration or login required.
- Customers will upload their storefront photo, select the sign area, choose templates, customise
  designs, and generate mockups when those capabilities are implemented.
- Template names and the relevant colours must update instantly in previews.
- Never claim planned functionality already works.

### Professional Studio

- A genuine professional workspace with manual editing.
- Future capabilities: accurate dimensions, 2D/3D designs, materials, lighting, mounting structures,
  technical drawings, and fabrication exports.
- Customer projects must be able to transfer into the Professional Studio.

### Admin space

- One shared login page for Admin and Pro members.
- Admin is redirected to the Admin Space after authentication; Pro members to the Professional Studio.
- Admin always has access to the Professional Studio.
- Only the Admin can grant or revoke Pro membership and manage protected global website settings.
- Admin permissions must be securely enforced on the server.
- Customers do not need accounts.

### Cost and safety

- Target zero mandatory operating costs.
- No automatic paid fallback for AI services.
- AI generation must have enforceable free-usage limits.
- Never expose secrets or API keys.

## Milestone order

| #   | Milestone                                                                          | Status                      |
| --- | ---------------------------------------------------------------------------------- | --------------------------- |
| 1   | Product interface: landing page, working customer demo, pro workspace entry        | Implemented (PR #1)         |
| 2   | Customer template and customisation foundation (local, free, instant previews)     | Implemented (PR #1)         |
| 3   | Storefront photo upload and sign-area selection (client-side)                      | Implemented (PR #1)         |
| 4   | Mockup generation: free client-side visual mockup (AI approach gated)              | Implemented (PR #1)         |
| 5   | Shared Admin/Pro authentication with server-enforced roles (Cloudflare Pages + D1) | Proposed — pending approval |
| 6   | Project transfer into the Professional Studio; pro editing tools                   | Later                       |

Each later milestone keeps every earlier capability working and keeps the honesty rules of the
architecture: only working controls are interactive, planned capabilities are labelled, and nothing
implies AI output is fabrication-accurate.

## Milestone 3 — implemented: storefront photo upload and sign-area selection

**Storefront photo upload and sign-area selection (client-side).** Shipped as proposed below;
the design decisions, scope, acceptance criteria, security considerations and tests recorded in
this section are the ones implemented.

### Safest approach (decided after inspecting the current architecture)

- **Image handling.** A file input (`accept="image/*"`) plus drag-and-drop. Validation by **magic
  bytes** (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF…WEBP`), never by extension or
  `Content-Type`, which are spoofable. Caps: ≤ 12 MB per file and ≤ 4096×4096 px after decode —
  this bounds browser memory and mitigates decode bombs. The photo is displayed with a plain `<img>`
  fed by `URL.createObjectURL(blob)` (the browser decodes it once and honours EXIF orientation). No
  canvas re-encode: the **original Blob is preserved byte-for-byte** in an in-memory store keyed by
  a generated photo id, one photo at a time; replacing or removing the photo revokes the previous
  object URL so nothing leaks. A SHA-256 of the bytes is computed with WebCrypto (`crypto.subtle`,
  built-in, no dependency) as a stable content identity for the draft.
- **Selection coordinates.** A rectangle stored **normalised** — `x, y, width, height` in 0..1
  relative to the image's natural size — clamped to the image bounds with a minimum size. Normalised
  coordinates are resolution-independent, survive re-uploads of the same photo at other sizes, and
  convert to pixel masks at generation time, which is exactly what future AI inpainting needs.
- **Selection UI.** The photo plus an absolutely-positioned HTML overlay (rectangle, 8 handles as
  real buttons, all sized in %) rather than a canvas: one image decode, no duplicated bitmap, and the
  handles are keyboard- and screen-reader-accessible for free. Drag on empty space to draw; drag
  handles to resize; drag inside to move; **Clear** and **Redraw** buttons; keyboard: arrows nudge,
  Shift+arrows resize, Delete clears. Pointer Events with `touch-action: none` on the surface for
  mobile. Percent-based overlay needs no RTL special-casing (the repo's RTL guard already forbids
  physical CSS properties).
- **Schematic placement, not compositing.** The photo panel shows the selection and a dashed
  "placement area" outline labelled as schematic. The sign-text preview stays in its own panel. No
  text is rendered onto the photo, and no perspective, lighting or shadow is simulated. Copy states
  plainly: the photo is processed locally in the browser and never uploaded; the placement is
  schematic; no AI compositing and no fabrication accuracy is implemented.
- **Draft v2.** `CustomerDraft` gains `photo: PhotoMeta | null` (id, name, type, sizeBytes, width,
  height, sha256) and `selection: NormalizedRect | null`. `parseDraft` accepts version 1 (migrated:
  photo/selection become `null`) and version 2, and refuses anything else. Pixel data stays in the
  session store in this milestone; durable persistence (IndexedDB under the same photo id) belongs to
  the later project-persistence work, and this data model is built so that step is additive.

### Exact scope

1. `src/projects/photo-validation.ts` — magic-byte and cap checks (+ tests).
2. `src/projects/photo-store.ts` — in-memory attach/get/release with object-URL lifecycle (+ tests).
3. `src/templates/types.ts`, `src/templates/draft.ts` — `PhotoMeta`, `NormalizedRect`, draft v2 with
   v1 migration, `draftWithPhoto`, `draftWithSelection`, `clearSelection` (+ tests).
4. `src/components/workflow/photo-upload.tsx` — input, drag-and-drop, localised validation errors,
   change/remove actions (+ css + tests).
5. `src/components/workflow/sign-area-picker.tsx` — photo, overlay, draw/move/resize, clear/redraw,
   keyboard support (+ css + tests).
6. `src/components/workflow/create-view.tsx` (+ css) — new "Your storefront" section integrated with
   the demo; responsive two-column desktop, stacked mobile.
7. `src/i18n/messages/{en,fr,ar}.ts` — new `create.photo` and `create.selection` namespaces
   (Arabic script in `ar`, enforced by the i18n parity test).
8. `scripts/smoke-test.mjs` — markers: photo section present in the prerendered `/create` HTML; no
   file inputs anywhere except the customer flow.
9. `e2e/photo.spec.ts` (new) — full flow per locale at 360/768/1280 px: upload a generated JPEG,
   draw/adjust/clear/redraw, keyboard nudge, RTL, no horizontal overflow, and an assertion that no
   request leaves the origin.
10. Docs: `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `README.md` and the PR body updated with the
    milestone.

### Acceptance criteria

- A visitor with no account uploads a storefront photo (JPEG/PNG/WebP, ≤ 12 MB, ≤ 4096×4096 px) and
  sees it on `/create`; wrong type, oversize file or oversize pixels produce clear localised errors.
- The selection can be drawn, adjusted (move/resize via handles), cleared and redrawn — with mouse,
  touch and keyboard.
- The draft serialises photo metadata + normalised selection; round-trips through `parseDraft`;
  version-1 drafts still parse (migrated); selections are clamped to the image bounds.
- The original Blob is preserved unmodified for the session; exactly one photo is held; replacing or
  removing it revokes the old object URL (unit-tested).
- Photo and selection are independent of template/text/colour changes and survive them.
- French, English and Arabic with correct RTL; works at 360 px with touch drawing; no horizontal
  overflow at 360/768/1280 px.
- No network egress for the photo (e2e asserts same-origin requests only); no new dependencies; no
  accounts; no paid services.
- Copy states the photo stays in the browser, the placement is schematic, and no AI compositing or
  fabrication accuracy is implemented.
- All existing checks stay green (unit, smoke, e2e) plus the new coverage.

### Security considerations

- Zero network: there is no upload endpoint, so there is no server attack surface; the e2e suite
  asserts every request stays same-origin (`blob:`/`data:` excepted). The photo never leaves the
  device in this milestone.
- Magic-byte validation (not extension/Content-Type); byte and pixel caps; single-photo memory
  bound; object URLs revoked on replace/remove.
- EXIF/metadata is never parsed or displayed; the file name is rendered as text only (React
  escapes it). Stripping EXIF becomes a deliberate step of the future persistence/transfer milestone.
- No `eval`, no `dangerouslySetInnerHTML`, no new dependencies, no CSP change needed (`blob:` images
  work with the current headers).

### Hosting note

This milestone adds zero server load — it is 100 % client-side — so it is compatible with Cloudflare
Pages (static hosting, free tier) at zero cost, with no serverless functions. When authentication
(Milestone 5) arrives, Cloudflare (Workers, D1/KV) becomes the candidate platform; that decision is
out of scope here.

## Milestone 4 — implemented: free client-side visual mockup (AI approach gated)

The proposal below was approved as written and implemented as Approach A. The section is kept as
the record of the decision: the two approaches, the enforceable-limits framework defined before
any AI provider, and the gate that still applies to any future AI-powered mockup.

**Mockup generation.** Two approaches were evaluated separately; only the first is proposed for
implementation.

### Approach A — free client-side visual mockup (proposed)

A basic, honest visual mockup rendered entirely in the browser with a 2D canvas: the sign (business
name and tagline) is drawn in the selected template's style and colours, placed **flat and
axis-aligned** inside the marked sign area on the customer's photo. There is no perspective
transform, no environmental lighting, no cast shadows and no occlusion handling — the copy says so
explicitly ("basic visual mockup — flat placement; no perspective, lighting or shadows; not a
fabrication-ready result"). The glow in some templates is part of the chosen sign style, not a
lighting simulation; the copy says that too. Cost: zero. Privacy: the photo never leaves the device
(the e2e suite asserts same-origin requests only). Dependencies: none — the canvas 2D API is built
in. `blob:` object URLs are same-origin, so the canvas is not tainted and PNG export works.

### Approach B — AI-powered realistic mockup (evaluated, not proposed)

A realistic composite (perspective, lighting, shadows) needs an AI image-editing provider, which means
sending the customer's photo to an external service. Key finding: **with no server, usage limits
cannot be truly enforced** — a client-side counter is advisory and trivially bypassed. True
enforcement needs a server-side counter. The only zero-cost candidate is a Cloudflare Worker (free
tier: 100k requests/day) proxying a free AI provider (e.g. Workers AI free tier or Hugging Face free
inference), with per-IP daily caps, a hard fail at the cap, the provider key as a Worker secret, and
**no automatic paid fallback ever**. Privacy cost: the photo leaves the device, so an explicit
consent flow and a provider data-retention review are prerequisites. On-device AI (WebGPU/ONNX) was
rejected: hundreds of MB of model download, slow on mobile, a heavy dependency.

**Gate:** no AI provider is added without (1) explicit owner approval, (2) the server-enforced
limits framework implemented and tested, (3) the privacy/consent flow, and (4) verified honesty
copy. Approach B is a separate future milestone; Milestone 4 ships only Approach A.

### Enforceable limits (defined before any AI provider)

- **Approach A (this milestone):** no quota exists — rendering is free, local compute. The
  enforceable limits are **performance limits**: rendering is user-initiated (a real button, never
  automatic), the button is disabled while a render is in progress, at most one render per second,
  and the output canvas is capped at 1600 px on the longest side (memory bound). These limits protect
  low-end phones; they never block browsing templates, editing text/colours, or any existing
  feature — nothing is ever "used up".
- **Any future AI approach:** per-visitor daily cap enforced **server-side** (Worker counter),
  hard-failed with a localised message when reached, no paid fallback, no client-side bypass. When
  the cap is reached, every existing feature (templates, colours, text, photo, the client-side mockup)
  keeps working — only AI generation stops.

### Exact scope

1. `src/templates/types.ts` + `catalogue.ts` — a small `mockup` descriptor per template:
   `board: "none" | "panel" | "glowPanel"` and `text: "flat" | "glow" | "gradient" | "band"`, matching
   the ten existing layouts (e.g. neon → glowPanel + glow, dimensional → panel + gradient, vinyl →
   none + flat, awning → band). No new templates, no colour changes.
2. `src/projects/mockup-render.ts` — `renderMockup({ photo, selection, draft, maxSize })` returning
   a canvas: photo drawn at capped size, sign board fitted flat into the selection rectangle, text
   measured and shrunk to fit, tagline beneath, per-template text transform (uppercase where the
   preview uppercases). Plus `canvasToPngBlob`. The canvas factory is injectable so unit tests run
   without a real 2d context (happy-dom returns `null`).
3. `src/components/workflow/mockup-panel.tsx` — the mockup panel: result `<img>`, "Generate mockup
   preview" button (disabled with an explanation when there is no photo or no selection — never a
   dead control), "Download PNG" button, rendering state announced via `aria-live`, and the honesty
   label. Throttle: disabled while rendering, ≥ 1 s between renders.
4. `src/components/workflow/sign-preview-demo.tsx` — integrate the panel in the preview column and
   own the render state (photo + selection + draft are already there).
5. `src/i18n/messages/{en,fr,ar}.ts` — a `create.mockup` namespace (title, lead, honesty label,
   generate/regenerate/download CTAs, disabled explanations, rendering state, error state).
6. `scripts/smoke-test.mjs` — markers: the mockup section and its honesty label in the prerendered
   `/create` HTML; the generate button present.
7. `e2e/mockup.spec.ts` — per locale × 360/768/1280: upload, draw, generate, assert the mockup
   image appears with the honesty label, click-through throttle (no double render), download a valid
   PNG (`acceptDownloads`), disabled states without photo/selection, RTL, no overflow, no
   cross-origin requests.
8. Docs: this section flips to "Implemented" on approval; `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`,
   `README.md`, PR body.

### Acceptance criteria

- A visitor with a photo and a selection clicks **Generate mockup preview** and sees a basic mockup:
  the business name (and tagline) in the selected template's style and colours, placed flat inside
  the marked area on their photo. The label clearly states it is a basic visual mockup — flat
  placement, no perspective, lighting or shadows, not fabrication-ready.
- **Download PNG** produces a valid PNG at the capped size; the file name is `signcraft-mockup.png`.
- Without a photo or a selection the generate button is disabled with a localised explanation.
- Changing template, text or colours and generating again updates the mockup; the throttle prevents
  overlapping renders (one per second, button disabled while rendering).
- Browsing templates, editing text/colours, the photo flow and every existing feature keep working
  at all times — no quota is ever reached.
- French, English and Arabic with correct RTL; works at 360 px; no horizontal overflow; keyboard
  operable; rendering state announced.
- No network egress for the photo or the mockup (e2e asserts same-origin only); no new dependencies;
  no API keys; no paid services.
- Error handling: a failed render shows a localised error and re-enables the button (retry); a
  missing 2d context shows a localised unsupported message.

### Security, privacy, performance, testing

- **Security/privacy:** all compute is local; the photo is never uploaded; the canvas is not tainted
  (`blob:` is same-origin) so export works without proxies; no secrets; EXIF is never read or sent.
- **Performance:** output capped at 1600 px; render only on demand; one render per second; text
  measurement loop bounded (minimum font size).
- **Testing:** renderer unit tests with an injected mock 2d context (draw sequence, pixel-rect math,
  font shrinking, transforms); component tests (disabled states, throttle, error state, RTL);
  smoke markers; e2e per locale × 3 viewports including a real download; the existing 182 unit,
  121 smoke and 87 e2e checks stay green.

## Milestone 5 — detailed proposal (pending approval, not started)

**Shared Admin/Pro authentication.** One login page for both roles; the role decides the
destination. Server-enforced permissions. Customers keep the free, account-free Customer Space.

### Security review (completed before implementation — findings and amendments)

An independent review of this proposal was performed before implementation. **Verdict: the
architecture is sound and password security is NOT weakened; the amendments below are hardening,
migration corrections and honest limitation notes.** Limits re-verified against official Cloudflare
documentation (Workers limits, updated 8 Oct 2026; D1 limits/pricing, 21 Apr 2026; KV limits,
8 Oct 2026; Pages limits, 5 Sep 2026; WAF availability, 19 Aug 2026).

**Password design — assessed and kept.** Measured on native crypto: PBKDF2-HMAC-SHA256 at 600,000
iterations costs ≈ 113 ms of CPU — 11× the 10 ms free-tier CPU limit; even 30,000 iterations
(≈ 7.5 ms, which would "fit") is 20× below the OWASP minimum of 600,000. So server-side hashing on
the free tier is either too slow or too weak, and **weakening the work factor to fit the CPU limit
was considered and rejected**. The browser-side pre-hash keeps the full 600,000-iteration work
factor (run on the visitor's device, which has no CPU quota) and does not weaken storage security:
the database holds `SHA-256(clientHash + PEPPER)`, so an attacker with the database alone cannot
verify a single guess offline (the pepper is a server secret, not in D1) — strictly stronger than
plain server-side PBKDF2 against a DB-only leak, and equal to it against a full server compromise.
The raw password never reaches the server. The `argon2id`-in-the-browser alternative
(e.g. argon2-browser WASM) was investigated and rejected: an extra dependency and memory-hardness
cost that low-end phones feel, for no security gain over PBKDF2-600k here. Two honest limitations
of pre-hashing are documented: (a) the server cannot verify how the client derived the hash, so
password policy (minimum length) is enforced in the UI — a crafted client could set a weaker
credential **for their own account** (self-harm only; no cross-account effect); (b) the client hash
is a replayable credential, but it is site-specific (per-account salt + pepper), TLS-protected, and
no more replayable than the password itself — rotating it is the password change.

**Verified controls (with amendments):**

- **Password storage:** per-account 128-bit random salt (CSPRNG); `password_hash =
SHA-256(clientHash + PEPPER)`; `PEPPER` is a wrangler secret, never committed; raw passwords and
  client hashes are never stored, logged or returned.
- **Login verification:** constant-time byte comparison (XOR-accumulate, never `===` on hex); the
  unknown-email path returns a dummy salt **and performs a dummy compare** so timing does not
  reveal account existence; one generic "invalid credentials" message.
- **Sessions:** new random 256-bit id per login (no fixation); cookie `__Host-sc_session`,
  `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`; 7-day absolute expiry with 1-day sliding renewal;
  logout deletes the row server-side and clears the cookie; suspend/revoke deletes the account's
  sessions. (`Secure` on `http://localhost` works because browsers treat localhost as a secure
  context — verified by e2e.)
- **CSRF:** `SameSite=Lax` plus an `Origin` check **and** a `Sec-Fetch-Site: cross-site` rejection
  on every state-changing endpoint; all mutations are POST (no state-changing GET), which also
  covers login-CSRF.
- **Rate limiting:** in-app D1-backed limiter (5 failures / 15 min per IP and per email-hash) with
  an in-isolate memory fast-path to keep D1 writes off the hot path; **plus one free WAF rate
  limiting rule** on `/api/auth/*` (the free plan includes exactly one IP-keyed rule — official WAF
  docs) as the first line of defense, configured at deployment time (it applies when the site is
  served from a Cloudflare-proxied custom domain, not on `*.pages.dev`). Residual free-tier risk,
  stated honestly: a flood can exhaust the shared 100k/day Function quota (Error 1027) until
  00:00 UTC — but only the auth APIs go offline; the static customer site keeps serving.
- **Account recovery:** invite/reset tokens are random 256-bit, stored hashed, single-use
  (consumed atomically: `UPDATE … WHERE used_at IS NULL` + row-count check), 1-hour expiry,
  rate-limited per IP; pros are recovered by admin-issued links; admin recovery is the documented
  break-glass procedure.
- **Initial admin setup:** allowed only while zero admins exist **and** the `SETUP_SECRET` matches
  (constant-time compare); the check-and-insert is one atomic statement
  (`INSERT … SELECT … WHERE NOT EXISTS (… role='admin')` + row-count check), so concurrent setup
  requests cannot create two admins; permanently refused afterwards; rate-limited; the page is
  unlinked.
- **API responses:** `Cache-Control: no-store` on every `/api/auth/*` response so session-dependent
  data is never cached at the edge.
- **SQL:** D1's parameterized `prepare().bind()` API only — no string interpolation into SQL.
- Optional hardening (free): a daily Cron Trigger (free plan allows 5/account) to purge expired
  sessions, tokens and rate-limit rows.

### Architecture evaluation (done before choosing)

Current state: the app is 100 % statically prerendered Next.js (16.4.0) run by `next start`; there
is no hosting configuration and no server code anywhere. Authentication is the first server-side
code this project needs, so the hosting decision is part of this milestone.

Verified free-tier facts (Cloudflare official limits, October 2026):

| Service                     | Free tier                                                       | Consequence for this design                                                    |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Pages static hosting        | unlimited requests & bandwidth, 500 builds/month                | all pages stay static and free                                                 |
| Pages Functions (= Workers) | 100,000 requests/day, **10 ms CPU per request**, 50 subrequests | only `/api/*` runs server code; page views never burn quota                    |
| D1 (SQLite)                 | 5 M rows read/day, 100 k rows written/day, 5 GB                 | accounts, sessions, rate limits, audit log fit easily                          |
| Workers KV                  | 100 k reads/day, **1,000 writes/day**, 1 GB                     | **rejected**: session writes + rate-limit counters could exhaust 1k writes/day |
| Workers Paid                | $5/month                                                        | **rejected**: zero mandatory operating costs is a hard requirement             |

Options considered:

1. **Cloudflare Pages (static export) + Pages Functions + D1 — RECOMMENDED.** The app is already
   fully static, so `output: "export"` fits. Only `/api/auth/*` runs as Functions; every page view
   stays on the unlimited static tier. D1 holds accounts/sessions/rate-limits/audit. KV is not
   needed (its 1,000 writes/day is the trap; D1's 100k writes/day is the headroom we want).
   Zero mandatory cost; `wrangler pages dev` reproduces the whole stack locally (workerd + local
   D1) for tests. Risks and their mitigations are listed below.
2. **Full Next.js on Workers (`@opennextjs/cloudflare`, nodejs_compat).** Rejected: every page render
   would become a Worker invocation (100k/day cap) and Next SSR routinely exceeds the 10 ms free
   CPU ceiling. The app needs no SSR.
3. **Self-hosted Node (`next start` on a VPS).** Rejected: not free.
4. **Vercel or other paid hosts.** Rejected: paid, and out of scope by standing constraint.

**Key design consequence of the 10 ms free CPU limit:** strong password hashing (PBKDF2 at
OWASP-recommended 600,000 iterations) costs ≈ 113 ms of native CPU — 11× over the 10 ms free-tier
limit (measured; see the security review above). So the browser does the expensive work (it has no
CPU quota): the login form fetches the account's salt, runs PBKDF2-SHA256 (600,000 iterations)
locally, and sends only the resulting hash; the server stores `SHA-256(clientHash + PEPPER)` with
`PEPPER` as a wrangler secret. The server never sees the raw password, and an attacker with the
database alone cannot verify guesses offline at all (the pepper is not in D1). No paid fallback
ever exists: if a free-tier ceiling is ever hit, the honest behaviour is a localised "try again
later" state, never an automatic upgrade.

### Routes and roles

- `/{locale}/login` — **one shared login page** for Admin and Pro (fr/en/ar, RTL). On success the
  server sets the session cookie and returns the role; the client redirects **admin →
  `/{locale}/admin`** (Admin Space), **pro → `/{locale}/studio`** (Professional Studio).
- `/{locale}/admin` — Admin Space: account management (list, invite, suspend, restore, revoke).
  Static shell; every action calls admin-only APIs.
- `/{locale}/studio` — Pro Studio: authenticated shell for professionals (tools stay labelled
  Planned — they are Milestone 6). **Admin always has access** (the studio APIs accept the admin
  role too).
- `/{locale}/pro` — unchanged public entry page; it links to the login page.
- `/{locale}/setup` — one-time initial-admin setup, unlinked, see below.
- **Customers:** `/` and `/{locale}/create` stay free, account-free and login-free. The nav gains a
  "Sign in" link for anonymous visitors and a role-aware link + "Sign out" when signed in
  (progressive enhancement; the default render is the signed-out state).

**Enforcement honesty:** page shells are client-side gates for UX only; the security boundary is the
API — every endpoint verifies the session and role server-side, and no admin data is ever in the
static HTML. This is stated in the UI copy and the docs.

### Security controls

- **Sessions:** random 256-bit id in D1; cookie `sc_session` is `HttpOnly`, `Secure`,
  `SameSite=Lax`, `Path=/`; 7-day absolute expiry with 1-day sliding renewal; logout deletes the
  row server-side and clears the cookie. Suspend/revoke deletes the account's sessions.
- **Passwords:** client-side PBKDF2-SHA256 (600,000 iterations, per-account salt) + server-side
  `SHA-256(clientHash + PEPPER)`; minimum length 12 enforced on both sides; raw passwords and
  client hashes are never stored, logged or returned; constant-time comparison.
- **CSRF:** `SameSite=Lax` plus an `Origin` check on every state-changing endpoint.
- **Enumeration resistance:** login returns one generic "invalid credentials" message; the prelogin
  endpoint returns a dummy salt for unknown emails.
- **Rate limiting (D1-backed):** 5 failed logins per 15 minutes per IP **and** per email; the setup
  endpoint is rate-limited per IP. IP comes from `CF-Connecting-IP` (best-effort, documented).
- **Initial admin setup:** `POST /api/auth/setup` succeeds **only** while zero admin accounts exist
  **and** the request carries the `SETUP_SECRET` wrangler secret (owner-generated, never committed).
  After the first admin exists the endpoint permanently refuses. The setup page is unlinked and
  shows "unavailable" once used.
- **Account management (admin-only, server-enforced):** create/invite a pro (the server generates a
  single-use, 1-hour invite token; the admin copies a one-time link and shares it — **no email
  service exists on the free tier**, so invite delivery is manual, stated honestly), suspend,
  restore, revoke. Roles are a fixed set (`admin`, `pro`); no endpoint lets a pro create accounts or
  grant admin; the only admin account is created by the one-time setup.
- **Account recovery:** pros are recovered by an admin-issued single-use reset link (same token
  mechanism). Admin recovery is a documented break-glass procedure (owner runs a `wrangler d1`
  command, or re-opens setup with a new `SETUP_SECRET` after removing the admin row) — no email
  dependency, stated honestly.
- **Audit log:** every account-management action is recorded (actor, action, target, IP, time).
- **Headers/secrets:** existing `nosniff` + `Referrer-Policy` stay; a CSP allowing `blob:` images is
  added (mockup export needs it); all secrets (`SETUP_SECRET`, `PASSWORD_PEPPER`) live only in
  wrangler secrets, never in the repo.

### Database schema (D1, SQLite)

```sql
accounts(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, role TEXT NOT NULL
  CHECK (role IN ('admin','pro')), name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','suspended','pending')),
  password_hash TEXT, salt TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
sessions(id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL, created_at TEXT NOT NULL, renewed_at TEXT NOT NULL);
account_tokens(token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL
  REFERENCES accounts(id) ON DELETE CASCADE, purpose TEXT NOT NULL CHECK (purpose IN ('invite','reset')),
  expires_at TEXT NOT NULL, used_at TEXT);
rate_limits(key TEXT NOT NULL, window_start TEXT NOT NULL, count INTEGER NOT NULL,
  PRIMARY KEY (key, window_start));
audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT, action TEXT NOT NULL,
  target_id TEXT, detail TEXT, ip TEXT, created_at TEXT NOT NULL);
```

### Migration notes and risks (explicit, for approval)

1. **Static export.** `next.config.ts` gains `output: "export"` and `images: { unoptimized: true }`
   (`next/image` is used by the hero, gallery and pro teaser; export requires it). `src/proxy.ts`
   (the locale header for 404s) cannot run on static hosting and is removed. Two config features
   also stop applying in export and move to Pages files (official Pages limits confirm both are
   supported): the security headers (`X-Content-Type-Options`, `Referrer-Policy`) move from
   `next.config.ts` `headers()` to `public/_headers`, and the `/` → `/fr` redirect moves from
   `redirects()` to `public/_redirects` (`/ /fr 307`, preserving the current 307). A `_routes.json`
   includes only `/api/*` so page views never invoke Functions. The smoke test's
   `x-nextjs-prerender` check (a `next start` header) is replaced by a static-serving check.
   **404 contract evolution:** Pages serves a single static `404.html` for unknown URLs, so a
   server-rendered per-locale `<html lang>` is no longer possible without per-request Functions
   (which would burn the 100k/day quota — rejected). The exported `404.html` instead embeds a tiny
   locale-detection script (written into `global-not-found.tsx` so the export carries it) that sets
   the correct `lang`/`dir`, shows the right language's heading, home link and language switcher.
   **The e2e 404 contract is preserved** (it asserts rendered `lang`/`dir`, heading text, the home
   link and the switcher — all produced by the script); only the **smoke raw-HTML lang check**
   changes to "404.html embeds the three locale variants and the detection logic". `/fr/projects`
   stays 404; the reserved-segment list is updated (`login`, `admin`, `studio`, `setup` become real
   routes). **Honest regression:** with JavaScript disabled, a 404 page shows the default locale —
   flagged here and in ARCHITECTURE.md.
2. **Preview-deployment isolation.** Pages preview deployments (PR previews) would otherwise share
   the production D1 database and secrets. The deployment checklist requires a separate preview D1
   database (`preview_database_id` in `wrangler.toml`) and preview-specific secrets, so a preview can
   never touch production accounts.
3. **Test infrastructure.** `npm run build` produces `out/`; `next start` no longer exists. The smoke
   test serves `out/` with a small dependency-free static server; e2e runs against `wrangler pages dev
out` (static + Functions + local D1 in one process — the real target environment). CI installs
   `wrangler` (devDependency, free) and the browser job runs against `wrangler pages dev`.
4. **Free-tier ceilings** are documented (100k Function requests/day, 10 ms CPU/request, D1 5M
   reads/100k writes/day): comfortable for a small studio; monitored via the Cloudflare dashboard;
   no paid fallback ever.
5. **No email delivery.** Invite/reset links are copied by the admin and shared manually.
6. **Deployment is a separate, owner-approved step.** This milestone adds `wrangler.toml` (no
   secrets), the Functions, and the local/CI test path. Nothing is deployed; no Cloudflare account,
   domain or secret is touched until the owner explicitly approves deployment. The deployment
   checklist (run only with explicit approval) includes: create the D1 database and apply the
   schema; set `SETUP_SECRET` and `PASSWORD_PEPPER` via `wrangler secret put`; configure a separate
   preview database and preview secrets; complete the one-time admin setup immediately; configure
   the single free WAF rate-limiting rule on `/api/auth/*` when serving from a proxied custom domain;
   monitor the 100k/day Function quota and D1 daily quotas in the dashboard.

### Scope (files, on approval)

- `wrangler.toml` (Pages project + D1 binding; no secrets), `functions/api/auth/**` (`prelogin`,
  `login`, `logout`, `me`, `setup`, `accounts` CRUD + suspend/restore/revoke),
  `functions/lib/**` (db, password, session, ratelimit, guard, responses), `functions/schema.sql`.
- `next.config.ts` (`output: "export"`), removal of `src/proxy.ts`, locale-aware `404.html` via
  `global-not-found.tsx`.
- Pages: `login`, `admin`, `studio`, `setup` (+ views, CSS modules); components `auth/`
  (login form, set-password form, gates, nav auth items); i18n namespaces `auth`, `admin`, `studio`
  in fr/en/ar.
- Tests: Functions unit tests with a mocked D1 (password vectors, timing-safe compare, session
  lifecycle, role guards, 403s for pro on admin APIs, rate-limit lockout, setup guard, token
  single-use/expiry, cookie attributes); component tests (login form pre-hash flow, set-password
  state, gates); `e2e/auth.spec.ts` per locale × 3 viewports (setup → admin login → admin space →
  invite pro → pro first login → studio; pro 403 on admin APIs; suspend/restore/revoke; logout;
  lockout; customers stay free; RTL; no overflow; no console errors).
- Existing suites stay green with the updated contracts: 210 unit, smoke (updated 404 matrix +
  new route markers), 99 e2e + the new auth spec.
- Docs: this section flips to "Implemented"; ARCHITECTURE (auth architecture, schema, security
  controls, break-glass recovery, CPU-limit rationale); DESIGN_SYSTEM (auth components); README.

### Acceptance criteria

1. One shared login page serves Admin and Pro, in French, English and Arabic with correct RTL.
2. Admin login redirects to Admin Space; Pro login redirects to Professional Studio.
3. Every API verifies the session and role server-side; no admin data appears in static HTML; the
   client-side gate is UX only and the docs say so.
4. Only Admin can create/invite, suspend, restore or revoke Professional accounts; a pro calling
   those APIs gets 403 and can never create accounts or grant admin.
5. Admin always retains Professional Studio access.
6. Customers use the free Customer Space with no accounts and no login; `/` and `/create` are
   unchanged.
7. Initial admin setup is one-time, secret-gated and permanently disabled afterwards; passwords
   use the pre-hash + pepper scheme with a 12-character minimum; sessions are HttpOnly/Secure/
   SameSite with absolute + sliding expiry; logout is server-side; login and setup are rate-limited;
   pro recovery is admin-issued reset links and admin recovery is the documented break-glass.
8. The architecture runs entirely on the Cloudflare free tier (verified limits above) with zero
   mandatory operating costs, no paid services and no automatic paid fallback.
9. No deployment, no Cloudflare account changes and no secrets are made by this milestone;
   deployment is a separate owner-approved step.
10. The complete suite passes: format, lint, typecheck, unit (existing + new Functions/component
    tests), build, smoke (updated 404 contract), browser tests (existing + auth e2e) — with the
    404 contract evolution explicitly reported.
11. The security-review amendments are implemented: timing-safe comparisons (including the
    unknown-email dummy path), `Sec-Fetch-Site` rejection, atomic single-use tokens and atomic
    setup insert, `Cache-Control: no-store` on auth APIs, the `__Host-` cookie prefix, the
    in-isolate rate-limit fast-path, and the documented pre-hashing limitations.
12. Honesty rules hold: the studio shell labels its tools Planned; the login/admin UI never implies
    more than it does; the docs state the no-email, free-tier-ceiling, no-JS-404 and pre-hashing
    limitations.
