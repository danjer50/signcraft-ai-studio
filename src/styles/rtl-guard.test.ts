// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/*
 * Arabic is right-to-left. Physical CSS properties (left/right) would stay put when the
 * page mirrors, so the UI would break. This test scans every stylesheet in src and fails
 * on any physical declaration. Use the logical equivalents instead:
 * margin-inline-start, padding-block-end, inset-inline-start, border-inline-end, text-align: start.
 */

const srcRoot = fileURLToPath(new URL("../", import.meta.url));

function listStylesheets(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return listStylesheets(full);
    return entry.endsWith(".css") ? [full] : [];
  });
}

const physicalPatterns: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "physical margin/padding/border/inset side",
    pattern: /^\s*(?:margin|padding|border|inset)-(?:left|right)(?:-[\w-]+)?\s*:/,
  },
  { name: "physical left/right offset", pattern: /^\s*(?:left|right)\s*:/ },
  { name: "text-align left/right", pattern: /text-align\s*:\s*(?:left|right)\b/ },
  { name: "float left/right", pattern: /float\s*:\s*(?:left|right)\b/ },
  {
    name: "physical corner radius",
    pattern: /(?:top|bottom)-(?:left|right)-radius\s*:/,
  },
];

describe("right-to-left safety", () => {
  const stylesheets = listStylesheets(srcRoot);

  it("finds the stylesheets it is meant to check", () => {
    expect(stylesheets.length).toBeGreaterThan(5);
  });

  it.each(stylesheets.map((file) => [path.relative(srcRoot, file), file]))(
    "%s uses only logical (direction-aware) properties",
    (_label, file) => {
      const violations: string[] = [];
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("/*") || trimmed.startsWith("*")) return;
        for (const { name, pattern } of physicalPatterns) {
          if (pattern.test(line)) {
            violations.push(`line ${index + 1} (${name}): ${trimmed}`);
          }
        }
      });
      expect(violations).toEqual([]);
    },
  );
});
