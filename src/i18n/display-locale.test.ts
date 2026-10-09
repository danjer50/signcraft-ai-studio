import { describe, expect, it } from "vitest";

import { defaultLocale } from "./config";
import { DISPLAY_LOCALE_HEADER, localeForPathname, localeFromHeader } from "./display-locale";

describe("localeForPathname", () => {
  it.each([
    ["/fr", "fr"],
    ["/en/a/b", "en"],
    ["/ar/x/y", "ar"],
    ["/fr/", "fr"],
  ])("uses the locale segment of %s", (pathname, expected) => {
    expect(localeForPathname(pathname)).toBe(expected);
  });

  it.each(["/", "", "/de", "/de/x/y", "/FR", "/frx/nope", "/nope"])(
    "falls back to the default locale for %s",
    (pathname) => {
      expect(localeForPathname(pathname)).toBe(defaultLocale);
    },
  );
});

describe("localeFromHeader", () => {
  it.each([
    ["fr", "fr"],
    ["en", "en"],
    ["ar", "ar"],
  ])("accepts the configured locale %s", (value, expected) => {
    expect(localeFromHeader(value)).toBe(expected);
  });

  it.each([null, "", "de", "FR", "constructor"])(
    "falls back to the default locale for %j",
    (value) => {
      expect(localeFromHeader(value)).toBe(defaultLocale);
    },
  );

  it("uses a lowercase header name, as HTTP header names are case-insensitive", () => {
    expect(DISPLAY_LOCALE_HEADER).toBe(DISPLAY_LOCALE_HEADER.toLowerCase());
  });
});
