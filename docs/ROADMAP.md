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

| #   | Milestone                                                                      | Status              |
| --- | ------------------------------------------------------------------------------ | ------------------- |
| 1   | Product interface: landing page, working customer demo, pro workspace entry    | Implemented (PR #1) |
| 2   | Customer template and customisation foundation (local, free, instant previews) | Implemented (PR #1) |
| 3   | Storefront photo upload and sign-area selection (client-side)                  | Later               |
| 4   | Mockup generation with enforceable free-usage limits (no paid fallback)        | Later               |
| 5   | Shared Admin/Pro authentication with server-enforced roles                     | Later               |
| 6   | Project transfer into the Professional Studio; pro editing tools               | Later               |

Each later milestone keeps every earlier capability working and keeps the honesty rules of the
architecture: only working controls are interactive, planned capabilities are labelled, and nothing
implies AI output is fabrication-accurate.

## Milestone 3 — detailed proposal (pending approval, not started)

**Storefront photo upload and sign-area selection (client-side).**

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
10. Docs: this section flips to "Implemented" on approval; `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`,
    `README.md` and the PR body are updated with the milestone.

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
