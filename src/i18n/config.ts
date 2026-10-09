/**
 * Locale configuration. This module must stay free of framework imports because
 * next.config.ts also reads `defaultLocale`.
 */

export const locales = ["fr", "en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export type Direction = "ltr" | "rtl";

const directions: Record<Locale, Direction> = {
  fr: "ltr",
  en: "ltr",
  ar: "rtl",
};

/** Each language is named in its own script so users can find theirs. */
export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): Direction {
  return directions[locale];
}
