import { describe, expect, it } from "vitest";

import { defaultLocale, getDirection, isLocale, localeNames, locales } from "./config";
import { getMessages } from "./get-messages";
import { replaceLocaleInPath } from "./locale-path";
import { ar } from "./messages/ar";
import { en } from "./messages/en";
import { fr } from "./messages/fr";

/** Flattens a nested message object into dotted paths, e.g. "nav.home" -> "Home". */
function collectLeaves(
  value: unknown,
  path: string[] = [],
  out: Map<string, string> = new Map(),
): Map<string, string> {
  if (typeof value === "string") {
    out.set(path.join("."), value);
    return out;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectLeaves(child, [...path, key], out);
    }
    return out;
  }
  throw new Error(`Unexpected non-string message at "${path.join(".")}"`);
}

const englishLeaves = collectLeaves(en);

describe("locale configuration", () => {
  it("supports French, English and Arabic, with French as the default", () => {
    expect(locales).toEqual(["fr", "en", "ar"]);
    expect(defaultLocale).toBe("fr");
  });

  it("accepts only configured locales", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("constructor")).toBe(false);
  });

  it("sets Arabic to right-to-left and the other languages to left-to-right", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("fr")).toBe("ltr");
    expect(getDirection("en")).toBe("ltr");
  });

  it("names each language in its own script", () => {
    expect(localeNames).toEqual({ fr: "Français", en: "English", ar: "العربية" });
  });
});

describe("message dictionaries", () => {
  it.each([
    ["fr", fr],
    ["ar", ar],
  ])("%s has exactly the same message keys as English", (_name, dictionary) => {
    const leaves = collectLeaves(dictionary);
    expect([...leaves.keys()].sort()).toEqual([...englishLeaves.keys()].sort());
  });

  it.each([
    ["en", en],
    ["fr", fr],
    ["ar", ar],
  ])("%s has no empty messages", (_name, dictionary) => {
    for (const [key, value] of collectLeaves(dictionary)) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("uses Arabic script for every Arabic message except the product name", () => {
    const arabicScript = /[\u0600-\u06FF]/;
    const allowedLatin = new Set(["app.name"]);
    for (const [key, value] of collectLeaves(ar)) {
      if (allowedLatin.has(key)) continue;
      expect(arabicScript.test(value), `ar "${key}" should be Arabic: ${value}`).toBe(true);
    }
  });

  it("returns the dictionary for each locale", () => {
    expect(getMessages("fr")).toBe(fr);
    expect(getMessages("en")).toBe(en);
    expect(getMessages("ar")).toBe(ar);
  });
});

describe("locale paths", () => {
  it("swaps the locale and keeps the rest of the path", () => {
    expect(replaceLocaleInPath("/fr", "en")).toBe("/en");
    expect(replaceLocaleInPath("/fr/projects/42", "ar")).toBe("/ar/projects/42");
    expect(replaceLocaleInPath("/en/", "fr")).toBe("/fr/");
  });

  it("adds a locale when the path has none", () => {
    expect(replaceLocaleInPath("/", "ar")).toBe("/ar");
    expect(replaceLocaleInPath("", "en")).toBe("/en");
    expect(replaceLocaleInPath("/projects", "en")).toBe("/en/projects");
  });
});
