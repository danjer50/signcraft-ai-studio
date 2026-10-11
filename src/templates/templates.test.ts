// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import type { Messages } from "@/i18n/messages/en";

import { signTemplates, templateIds } from "./catalogue";
import { colourPalette } from "./palette";
import { letteringIds, type TemplateId } from "./types";

const templateIdSet = new Set<string>(templateIds);

function tokenFromTokensCss(name: string): string {
  const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) {
    throw new Error(`Missing --${name} in tokens.css`);
  }
  return match[1].toLowerCase();
}

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

describe("template catalogue", () => {
  it("has at least ten templates with unique ids and one or two colour slots", () => {
    expect(signTemplates.length).toBeGreaterThanOrEqual(10);
    expect(new Set(templateIds).size).toBe(signTemplates.length);
    for (const template of signTemplates) {
      expect(template.slots.length).toBeGreaterThanOrEqual(1);
      expect(template.slots.length).toBeLessThanOrEqual(3);
      expect(new Set(template.slots.map((slot) => slot.role)).size).toBe(template.slots.length);
    }
  });

  it("carries a valid visual-mockup treatment for every template", () => {
    const boards = new Set(["none", "panel", "glowPanel"]);
    const texts = new Set(["flat", "glow", "gradient", "band"]);
    for (const template of signTemplates) {
      expect(boards.has(template.mockup.board)).toBe(true);
      expect(texts.has(template.mockup.text)).toBe(true);
    }
  });

  it("offers known colours only, with the slot default inside the options", () => {
    for (const template of signTemplates) {
      for (const slot of template.slots) {
        expect(slot.options.length).toBeGreaterThanOrEqual(3);
        const ids = slot.options.map((option) => option.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain(slot.defaultId);
        for (const option of slot.options) {
          expect(colourPalette[option.id]).toBe(option.value);
          expect(option.value).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("names every template and colour in all three locales", () => {
    const locales: Array<[string, Messages]> = [
      ["fr", getMessages("fr")],
      ["en", getMessages("en")],
      ["ar", getMessages("ar")],
    ];
    for (const [locale, messages] of locales) {
      const items = messages.templates.items as Record<string, { name: string; hint: string }>;
      expect(Object.keys(items).sort(), locale).toEqual([...templateIdSet].sort());
      for (const template of signTemplates) {
        const copy = items[template.id as TemplateId];
        expect(copy?.name, `${locale} ${template.id} name`).toBeTruthy();
        expect(copy?.hint, `${locale} ${template.id} hint`).toBeTruthy();
      }
      const names = messages.colours.names as Record<string, string>;
      for (const colourId of Object.keys(colourPalette)) {
        expect(names[colourId], `${locale} colour ${colourId}`).toBeTruthy();
      }
    }
  });

  it("meets WCAG AA for every palette colour on the sign scene background", () => {
    const sceneBackground = tokenFromTokensCss("color-bg");
    for (const [id, value] of Object.entries(colourPalette)) {
      const ratio = contrastRatio(value.toLowerCase(), sceneBackground);
      expect(ratio, `${id} (${value}) on ${sceneBackground}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives every template a complete composition (frame, emblem, arrangement, lettering, scene)", () => {
    const frames = new Set([
      "none",
      "thin",
      "double",
      "rounded",
      "badge",
      "awning",
      "marquee",
      "blade",
      "plaque",
      "banner",
    ]);
    const emblems = new Set([
      "scissors",
      "coffeeCup",
      "cross",
      "star",
      "gear",
      "leaf",
      "crown",
      "phone",
      "car",
      "dumbbell",
      "croissant",
      "key",
      "house",
      "wrench",
      "bolt",
      "diamond",
      "flourish",
      "tooth",
      "hammer",
      "shirt",
      "apple",
      "signPanel",
      "paintbrush",
      "heart",
      "none",
    ]);
    const arrangements = new Set([
      "stack",
      "split",
      "badge",
      "band",
      "vertical",
      "columns",
      "inline",
      "tower",
    ]);
    const letterings = new Set([
      "modern",
      "classic",
      "mono",
      "rounded",
      "condensed",
      "script",
      "kufi",
      "naskh",
      "display",
      "elegant",
    ]);
    const backgrounds = new Set([
      "night",
      "wall",
      "window",
      "wood",
      "metal",
      "marble",
      "concrete",
      "dusk",
    ]);
    for (const template of signTemplates) {
      const c = template.composition;
      expect(frames.has(c.frame), `${template.id} frame`).toBe(true);
      expect(emblems.has(c.emblem), `${template.id} emblem`).toBe(true);
      expect(arrangements.has(c.arrangement), `${template.id} arrangement`).toBe(true);
      expect(letterings.has(c.lettering), `${template.id} lettering`).toBe(true);
      expect(backgrounds.has(c.background), `${template.id} background`).toBe(true);
      for (const variant of c.variants ?? []) {
        expect(arrangements.has(variant), `${template.id} variant`).toBe(true);
        expect(variant).not.toBe(c.arrangement);
      }
    }
  });

  it("composes genuinely distinct designs: no two templates share a composition signature", () => {
    // A template is a complete composition, not a recolour: two templates may share
    // a frame or a lettering style, but never the whole signature.
    const signatures = new Set<string>();
    for (const template of signTemplates) {
      const c = template.composition;
      const signature = [
        c.frame,
        c.emblem,
        c.arrangement,
        c.lettering,
        c.background,
        template.layout,
        template.slots.map((slot) => `${slot.role}:${slot.defaultId}`).join("|"),
      ].join("~");
      expect(signatures.has(signature), `duplicate composition: ${template.id}`).toBe(false);
      signatures.add(signature);
    }
  });

  it("covers a meaningful range of business categories", () => {
    const categories = new Set(signTemplates.map((template) => template.category));
    // The library spans hospitality, retail, services, industry and brand styles.
    // The floor grows with the library; the complete collection covers 15+.
    expect(categories.size).toBeGreaterThanOrEqual(6);
  });

  it("names every template's category in all three locales", () => {
    const locales: Array<[string, Messages]> = [
      ["fr", getMessages("fr")],
      ["en", getMessages("en")],
      ["ar", getMessages("ar")],
    ];
    for (const [locale, messages] of locales) {
      const categories = messages.templates.categories;
      for (const template of signTemplates) {
        expect(
          categories[template.category],
          `${locale} category label ${template.category}`,
        ).toBeTruthy();
      }
      // Every lettering style the picker can show is named in all locales.
      const lettering = messages.templates.lettering;
      for (const letteringId of letteringIds) {
        expect(lettering.names[letteringId], `${locale} lettering ${letteringId}`).toBeTruthy();
      }
    }
  });
});
