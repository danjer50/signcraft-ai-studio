// @vitest-environment node
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const tokensCss = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

/** Collects hex colour tokens such as --color-text: #111827; */
function readHexTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) {
      tokens.set(name, value.toLowerCase());
    }
  }
  return tokens;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two hex colours. */
function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const tokens = readHexTokens(tokensCss);

function token(name: string): string {
  const value = tokens.get(name);
  if (value === undefined) {
    throw new Error(`Missing colour token --${name} in tokens.css`);
  }
  return value;
}

/** [foreground, background, minimum ratio]. 4.5 is WCAG AA for text, 3 for UI boundaries and focus. */
const requiredPairs: Array<[string, string, number]> = [
  ["color-text", "color-bg", 4.5],
  ["color-text", "color-surface", 4.5],
  ["color-text", "color-surface-muted", 4.5],
  ["color-text-muted", "color-bg", 4.5],
  ["color-text-muted", "color-surface", 4.5],
  ["color-text-muted", "color-surface-muted", 4.5],
  ["color-accent-strong", "color-surface", 4.5],
  ["color-accent-strong", "color-bg", 4.5],
  ["color-on-accent", "color-accent", 4.5],
  ["color-on-accent-soft", "color-accent-soft", 4.5],
  ["color-surface", "color-text", 4.5],
  ["color-on-neutral-soft", "color-neutral-soft", 4.5],
  ["color-on-info-soft", "color-info-soft", 4.5],
  ["color-on-success-soft", "color-success-soft", 4.5],
  ["color-on-warning-soft", "color-warning-soft", 4.5],
  ["color-on-danger-soft", "color-danger-soft", 4.5],
  ["color-focus", "color-bg", 3],
  ["color-focus", "color-surface", 3],
  ["color-border-strong", "color-surface", 3],
];

describe("design tokens", () => {
  it.each(requiredPairs)("--%s on --%s meets %s:1", (foreground, background, minimum) => {
    const ratio = contrastRatio(token(foreground), token(background));
    expect(
      ratio,
      `--${foreground} (${token(foreground)}) on --${background} (${token(background)}) is ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(minimum);
  });

  it("parses the tokens it checks (guards against a silently empty parse)", () => {
    expect(tokens.size).toBeGreaterThan(20);
    expect(tokensCss).toContain("--touch-target");
  });

  it("defines a 44px minimum touch target", () => {
    expect(tokensCss).toMatch(/--touch-target:\s*2\.75rem;/);
  });
});
