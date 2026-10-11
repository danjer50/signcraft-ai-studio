import { notFound } from "next/navigation";

import { isLocale, type Locale } from "./config";

/**
 * Reads the locale segment of a route. The locale routes use `dynamicParams = false`, so only
 * the configured locales ever reach this function. The check narrows the type; the 404 branch
 * is a safeguard that Next.js should never reach.
 */
export async function localeFromRouteParams(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
