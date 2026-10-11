# Design system

The design system is the set of tokens, primitives and rules that every screen uses. Components read
tokens only. Values are never hard-coded in component CSS. Changing a token changes the whole app.

Sources:

- Tokens: `src/styles/tokens.css`
- Global base styles: `src/styles/globals.css`
- Primitives: `src/components/ui/`
- Checks: `src/styles/design-tokens.test.ts` (contrast), `src/styles/rtl-guard.test.ts` (direction)

## Principles

1. **Accessible by default.** Text meets WCAG AA (4.5:1). Focus rings and control outlines meet 3:1.
   Interactive controls are at least 44px high.
2. **Direction-neutral.** Layout uses logical properties (start, end, inline, block), so Arabic mirrors
   without special cases. Physical `left` and `right` are not allowed.
3. **Honest status.** A control appears only when it works. Planned features are labelled "Planned".
4. **Calm and professional.** Deep charcoal/graphite surfaces, one restrained electric-cyan accent for
   action and identity, subtle lighting and glass used sparingly. Status colours only for status.

## Colour

Dark theme only (the visual identity of the product surface). The palette is in `tokens.css`. Each text
colour is checked against the surface it is placed on.

| Role                                            | Token                                               | Value     | Use                                                       |
| ----------------------------------------------- | --------------------------------------------------- | --------- | --------------------------------------------------------- |
| Page background                                 | `--color-bg`                                        | `#0b0f14` | Deep charcoal page                                        |
| Surface                                         | `--color-surface`                                   | `#131a22` | Header, cards, drawer, demo panels                        |
| Muted surface                                   | `--color-surface-muted`                             | `#0f151c` | Hover states, planned callouts                            |
| Decorative border                               | `--color-border`                                    | `#263340` | Dividers, card edges. Not required for contrast.          |
| Control border                                  | `--color-border-strong`                             | `#5b6b7c` | Buttons and language switcher outlines (4.6:1 on surface) |
| Text                                            | `--color-text`                                      | `#eef2f6` | Body and headings (13.6:1 on surface)                     |
| Muted text                                      | `--color-text-muted`                                | `#a7b4c0` | Secondary copy, planned items (7.5:1 on surface)          |
| Accent                                          | `--color-accent`                                    | `#22d3ee` | Primary button, brand tile (electric cyan)                |
| Accent, strong                                  | `--color-accent-strong`                             | `#67e8f9` | Links, primary button hover (10.3:1 on surface)           |
| Accent, soft                                    | `--color-accent-soft`                               | `#123642` | Current page in navigation                                |
| Focus                                           | `--color-focus`                                     | `#7dd3fc` | Keyboard focus ring (10.6:1 on surface)                   |
| Status: neutral, info, success, warning, danger | `--color-{tone}-soft` with `--color-on-{tone}-soft` | see file  | Badges                                                    |
| Glass                                           | `--glass-surface`, `--glass-border`, `--glass-blur` | see file  | Restrained overlays: hero panel, pro teaser, previews     |
| Glow                                            | `--shadow-glow`                                     | see file  | Cyan halo on hover, never on static surfaces              |

Each status tone is a soft surface with text of the same hue. Every pair meets 4.5:1.
A status is never shown by colour alone: badges always carry text.

## Typography

- Sans: `--font-sans`, a system UI stack. No web font is loaded.
- Arabic: `--font-arabic`, a stack that begins with system fonts that cover Arabic. Applied with
  `:root:lang(ar)`.
- Scale: `--text-xs` (12px) to `--text-5xl` (48px). Body is 16px with 1.5 line height. Headings use 1.25
  (`--leading-tight`) up to 1.1 for display (`--leading-display`).
- Display headings use `--tracking-display` (tight) and may use `clamp()` between two type tokens.
- Headings use `text-wrap: balance`, and paragraphs use `text-wrap: pretty`.

## Spacing, shape and elevation

- Spacing: `--space-1` (4px) to `--space-12` (48px), on a 4px base.
- Radius: `--radius-sm` (6px), `--radius-md` (10px, controls), `--radius-lg` (16px, cards),
  `--radius-xl` (24px, hero and feature bands), `--radius-pill`.
- Shadows: `--shadow-sm` for cards, `--shadow-lg` for the drawer and skip link, `--shadow-glow` for the
  restrained cyan halo on interactive hover.
- Depth is restrained: borders first, glass only over imagery, glow only on hover.

## Layout and breakpoints

| Name    | Width                 | Behaviour                                                                                        |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| Mobile  | below 40rem (640px)   | One column. Header holds the menu button and brand. Language switcher at the foot of the drawer. |
| Tablet  | 40rem to 64rem        | One column. Header adds the language switcher. Navigation stays in the drawer.                   |
| Desktop | 64rem (1024px) and up | Sidebar navigation. Menu button and drawer hidden. Build label shown in the header.              |

- `--header-height` is 4rem. `--sidebar-width` is 17.5rem. `--drawer-width` is `min(20rem, 85vw)`.
- Content is capped at `--content-max-width` (72rem) and centred.
- `--touch-target` is 2.75rem (44px), the minimum size for interactive controls.

## Motion

- `--motion-fast` (120ms) for hover and colour changes. `--motion-base` (200ms) for the drawer, backdrop
  and card hover. `--motion-slow` (320ms) for gentle emphasis only.
- `--ease-standard` is `cubic-bezier(0.2, 0, 0, 1)`.
- Anchor scrolling is smooth only under `prefers-reduced-motion: no-preference`.
- `prefers-reduced-motion: reduce` shortens every transition and animation to effectively zero.

## Direction

- Set on `<html>` by the locale layout (`dir="ltr"` or `dir="rtl"`).
- `--inline-direction` is `1` in LTR and `-1` in RTL. Use it to move an element off its start edge:
  `translate: calc(var(--inline-direction) * -100%) 0`.
- Use `margin-inline-start`, `padding-block-end`, `inset-inline-end`, `border-inline-start`,
  `text-align: start`, and `border-start-start-radius` and similar. Do not use `left`, `right`,
  `text-align: left` or `float: right`. The RTL guard test enforces this.
- Icons in this set are not directional. Any future arrow or chevron must flip in RTL, using a
  `transform: scaleX(-1)` rule under `:root[dir="rtl"]`.

## Components

| Component                                                             | File                               | Notes                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                              | `ui/button.tsx`                    | `primary`, `secondary` and `ghost` variants. Defaults to `type="button"`. `buttonClassName` gives the same look to links.                                                                                                                                                                                                 |
| `Badge`                                                               | `ui/badge.tsx`                     | Tones: `neutral`, `info`, `success`, `warning`, `danger`. Always contains text.                                                                                                                                                                                                                                           |
| `Card`                                                                | `ui/card.tsx`                      | Surface with border and radius. Can render as `div`, `section` or `article`.                                                                                                                                                                                                                                              |
| Icons                                                                 | `ui/icons.tsx`                     | Inline, stroke-based, `aria-hidden`. The label beside each icon carries the meaning.                                                                                                                                                                                                                                      |
| `AppShell`                                                            | `app-shell/app-shell.tsx`          | Header, navigation, language switcher and main landmark.                                                                                                                                                                                                                                                                  |
| `PrimaryNavigation`                                                   | `app-shell/primary-navigation.tsx` | Sidebar on desktop, drawer on mobile. Planned sections are not links.                                                                                                                                                                                                                                                     |
| `LanguageSwitcher`                                                    | `app-shell/language-switcher.tsx`  | Links to the same page in each language. Marks the current language with `aria-current="true"`. `fill` stretches the options across the drawer.                                                                                                                                                                           |
| `SignPreviewDemo`                                                     | `workflow/sign-preview-demo.tsx`   | The working local demo: business-name fields, template picker, colour picker and a live style preview. Its copy states that it is not AI output or a fabrication model.                                                                                                                                                   |
| `TemplatePicker`, `ColourPicker`, `SignPreview`                       | `workflow/`                        | The demo's parts: radio-card template selection, named colour swatches, and the preview. Colours are CSS custom properties; template layouts are `data-layout` treatments.                                                                                                                                                |
| `PhotoUpload`, `SignAreaPicker`                                       | `workflow/`                        | The storefront photo panel: validated upload control, the photo with an adjustable dashed selection (8 handles), clear/redraw/default actions and keyboard support. The overlay is a `direction: ltr` coordinate system so the selection always aligns with the photo pixels in RTL. The placement is labelled schematic. |
| `MockupPanel`                                                         | `workflow/`                        | The visual mockup: a real button (generate / update), PNG download, disabled states with explanations, an `aria-live` rendering status, and the honesty note. Rendering is user-initiated and throttled; the result is labelled a basic flat mockup — no perspective, lighting or shadows.                                |
| `Hero`, `ExamplesGallery`, `WorkflowSummary`, `ProTeaser`, `HomeView` | `home/`                            | The landing page sections. Imagery is labelled as illustrative.                                                                                                                                                                                                                                                           |
| `WorkflowSteps`                                                       | `workflow/workflow-steps.tsx`      | The four customer steps with status badges. The planned step has no controls.                                                                                                                                                                                                                                             |
| `LoginForm`, `SetupForm`, `SetPasswordForm`                           | `auth/`                            | The auth forms (Milestone 5). Labels are associated with `htmlFor`; errors use `role="alert"`; submit buttons disable while submitting. The password is pre-hashed in the browser before submit.                                                                                                                          |
| `AdminDashboard`                                                      | `auth/admin-dashboard.tsx`         | The Admin Space (Milestone 5): account table with role/status badges, invite form with a copyable one-time link, two-click confirm for suspend/revoke. Data comes only from the admin API.                                                                                                                                |
| `StudioPanel`                                                         | `auth/studio-panel.tsx`            | The Professional Studio shell (Milestone 5): signed-in account, role badge, sign out, and the editing tools labelled "Planned".                                                                                                                                                                                           |
| `NavAuth`                                                             | `auth/nav-auth.tsx`                | The header auth state (Milestone 5): Sign in link, or the role's space link + Sign out. Probes `/api/auth/me` on mount and on route change; renders nothing until the probe resolves.                                                                                                                                     |
| Auth form styles                                                      | `auth/auth-form.module.css`        | The shared auth panel: surface panel, labelled fields, inputs (token colours, focus ring), error/success alerts, and the dashboard table + invite-link styles.                                                                                                                                                            |

## Accessibility rules

- Every app page has one `<h1>`. Headings do not skip levels.
- The skip link is the first focusable element and targets `#main-content`.
- Focus is always visible: a 3px `--color-focus` outline with a 2px offset.
- Icons are decorative (`aria-hidden`), and every icon sits next to visible text.
- Navigation uses `aria-current="page"` for the current page.
- A status is never conveyed by colour alone.
- Keyboard: Escape closes the drawer and returns focus to the menu button.

## Adding or changing a token

1. Change the value in `src/styles/tokens.css`.
2. If it is a text colour, add or update its pair in `requiredPairs` in
   `src/styles/design-tokens.test.ts`, and run `npm test`. A failing pair means the new colour is too
   low-contrast. Adjust the value, do not lower the threshold.
3. Run `npm run check`.
