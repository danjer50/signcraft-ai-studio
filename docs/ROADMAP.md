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

| #   | Milestone                                                                      | Status                      |
| --- | ------------------------------------------------------------------------------ | --------------------------- |
| 1   | Product interface: landing page, working customer demo, pro workspace entry    | Implemented (PR #1)         |
| 2   | Customer template and customisation foundation (local, free, instant previews) | Implemented (PR #1)         |
| 3   | Storefront photo upload and sign-area selection (client-side)                  | Implemented (PR #1)         |
| 4   | Mockup generation: free client-side visual mockup (AI approach gated)          | Proposed — pending approval |
| 5   | Shared Admin/Pro authentication with server-enforced roles                     | Later                       |
| 6   | Project transfer into the Professional Studio; pro editing tools               | Later                       |

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

## Milestone 4 — detailed proposal (pending approval, not started)

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
