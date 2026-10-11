import { describe, expect, it } from "vitest";

import { computeFitScale, isArabicText, MIN_FIT_SCALE, shouldWrapName } from "./text-fit";

describe("isArabicText", () => {
  it("detects Arabic-script text", () => {
    expect(isArabicText("مقهى")).toBe(true);
    expect(isArabicText("Café مقهى")).toBe(true);
    // Arabic presentation forms (ligatures) are Arabic too.
    expect(isArabicText("ﷺ")).toBe(true);
  });

  it("does not flag Latin, French or digits", () => {
    expect(isArabicText("Cafe de la Medina")).toBe(false);
    expect(isArabicText("Lumière & Café")).toBe(false);
    expect(isArabicText("123")).toBe(false);
    expect(isArabicText("")).toBe(false);
  });
});

describe("computeFitScale", () => {
  it("returns 1 when the text fits", () => {
    expect(computeFitScale(100, 200)).toBe(1);
    expect(computeFitScale(200, 200)).toBe(1);
  });

  it("scales down when the text overflows", () => {
    expect(computeFitScale(400, 200)).toBe(0.5);
  });

  it("never goes below the minimum scale", () => {
    expect(computeFitScale(10000, 100)).toBe(MIN_FIT_SCALE);
  });

  it("is safe against degenerate measurements", () => {
    expect(computeFitScale(Number.NaN, 100)).toBe(1);
    expect(computeFitScale(100, 0)).toBe(MIN_FIT_SCALE);
  });
});

describe("shouldWrapName", () => {
  it("keeps short names on one line", () => {
    expect(shouldWrapName("Café")).toBe(false);
    expect(shouldWrapName("Café de la Medina")).toBe(false);
  });

  it("wraps long names instead of shrinking them into unreadability", () => {
    expect(shouldWrapName("Boulangerie Pâtisserie de la Médina")).toBe(true);
  });
});
