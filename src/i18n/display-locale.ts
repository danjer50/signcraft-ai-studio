import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * Request header that carries the display locale from the proxy to the global not-found page.
 * Next.js renders unmatched URLs without running any layout, so the page cannot read the locale
 * from its params. See docs/ARCHITECTURE.md, section 4.
 */
export const DISPLAY_LOCALE_HEADER = "x-signcraft-locale";

/** The language a URL path belongs to. A path without a valid first segment uses the default. */
export function localeForPathname(pathname: string): Locale {
  const [, first = ""] = pathname.split("/");
  return isLocale(first) ? first : defaultLocale;
}

/** Reads the locale the proxy stored for this request. A missing or invalid value uses the default. */
export function localeFromHeader(value: string | null): Locale {
  return value !== null && isLocale(value) ? value : defaultLocale;
}
