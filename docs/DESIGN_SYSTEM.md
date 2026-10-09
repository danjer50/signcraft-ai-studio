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
4. **Calm and professional.** Neutral surfaces, one warm accent (signal orange) for action and identity,
   and status colours used only for status.

## Colour

Light theme only. The palette is in `tokens.css`. Each text colour is checked against the surface it is
placed on.

| Role                                            | Token                                               | Value     | Use                                                     |
| ----------------------------------------------- | --------------------------------------------------- | --------- | ------------------------------------------------------- |
| Page background                                 | `--color-bg`                                        | `#f4f6f8` | Page                                                    |
| Surface                                         | `--color-surface`                                   | `#ffffff` | Header, cards, drawer                                   |
| Muted surface                                   | `--color-surface-muted`                             | `#e9edf2` | Hover states                                            |
| Decorative border                               | `--color-border`                                    | `#c5ced9` | Dividers, card edges. Not required for contrast.        |
| Control border                                  | `--color-border-strong`                             | `#6b7689` | Buttons and language switcher outlines (4.6:1 on white) |
| Text                                            | `--color-text`                                      | `#111827` | Body and headings (17.7:1 on white)                     |
| Muted text                                      | `--color-text-muted`                                | `#4b5563` | Secondary copy, planned items (7.6:1 on white)          |
| Accent                                          | `--color-accent`                                    | `#c2410c` | Primary button, brand tile                              |
| Accent, strong                                  | `--color-accent-strong`                             | `#9a3412` | Links, primary button hover (7.3:1 on white)            |
| Accent, soft                                    | `--color-accent-soft`                               | `#ffedd5` | Current page in navigation                              |
| Focus                                           | `--color-focus`                                     | `#1d4ed8` | Keyboard focus ring (6.7:1 on white)                    |
| Status: neutral, info, success, warning, danger | `--color-{tone}-soft` with `--color-on-{tone}-soft` | see file  | Badges                                                  |

Each status tone is a soft background with a dark text colour of the same hue. Every pair meets 4.5:1.
A status is never shown by colour alone: badges always carry text.

## Typography

- Sans: `--font-sans`, a system UI stack. No web font is loaded.
- Arabic: `--font-arabic`, a stack that begins with system fonts that cover Arabic. Applied with
  `:root:lang(ar)`.
- Scale: `--text-xs` (12px) to `--text-3xl` (30px). Body is 16px with 1.5 line height. Headings use 1.2.
- Headings use `text-wrap: balance`, and paragraphs use `text-wrap: pretty`.

## Spacing, shape and elevation

- Spacing: `--space-1` (4px) to `--space-12` (48px), on a 4px base.
- Radius: `--radius-sm` (6px), `--radius-md` (10px, controls), `--radius-lg` (16px, cards), `--radius-pill`.
- Shadows: `--shadow-sm` for cards, `--shadow-lg` for the drawer and skip link.

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

- `--motion-fast` (120ms) for hover and colour changes. `--motion-base` (200ms) for the drawer and backdrop.
- `--ease-standard` is `cubic-bezier(0.2, 0, 0, 1)`.
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

| Component           | File                               | Notes                                                                                                                                           |
| ------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`            | `ui/button.tsx`                    | `primary`, `secondary` and `ghost` variants. Defaults to `type="button"`. `buttonClassName` gives the same look to links.                       |
| `Badge`             | `ui/badge.tsx`                     | Tones: `neutral`, `info`, `success`, `warning`, `danger`. Always contains text.                                                                 |
| `Card`              | `ui/card.tsx`                      | Surface with border and radius. Can render as `div`, `section` or `article`.                                                                    |
| Icons               | `ui/icons.tsx`                     | Inline, stroke-based, `aria-hidden`. The label beside each icon carries the meaning.                                                            |
| `AppShell`          | `app-shell/app-shell.tsx`          | Header, navigation, language switcher and main landmark.                                                                                        |
| `PrimaryNavigation` | `app-shell/primary-navigation.tsx` | Sidebar on desktop, drawer on mobile. Planned sections are not links.                                                                           |
| `LanguageSwitcher`  | `app-shell/language-switcher.tsx`  | Links to the same page in each language. Marks the current language with `aria-current="true"`. `fill` stretches the options across the drawer. |

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
