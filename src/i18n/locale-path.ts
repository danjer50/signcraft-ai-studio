import { isLocale, type Locale } from "./config";

/**
 * Swaps the locale segment of a pathname and keeps the rest of the path, so the
 * language switcher lands on the equivalent page in another language.
 */
export function replaceLocaleInPath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  const first = segments[1];
  if (first !== undefined && isLocale(first)) {
    segments[1] = locale;
    return segments.join("/");
  }
  return pathname === "" || pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}
