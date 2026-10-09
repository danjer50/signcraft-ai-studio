import type { Metadata } from "next";
import { headers } from "next/headers";

import { AppDocument, appViewport } from "@/components/app-shell/app-document";
import { NotFoundView } from "@/components/not-found/not-found-view";
import type { Locale } from "@/i18n/config";
import { DISPLAY_LOCALE_HEADER, localeFromHeader } from "@/i18n/display-locale";
import { getMessages } from "@/i18n/get-messages";
import "@/styles/tokens.css";
import "@/styles/globals.css";

export const viewport = appViewport;

async function displayLocale(): Promise<Locale> {
  return localeFromHeader((await headers()).get(DISPLAY_LOCALE_HEADER));
}

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages(await displayLocale());
  return {
    title: messages.notFound.title,
    description: messages.notFound.body,
  };
}

/**
 * Renders every URL that no route matches: unknown locales such as /de, and unknown paths such
 * as /fr/does-not-exist. Next.js renders it without the locale layout, so the locale comes from
 * the header that src/proxy.ts sets. The response has status 404 and server-rendered content with
 * the correct `lang` and `dir`. See docs/ARCHITECTURE.md, section 4.
 */
export default async function GlobalNotFound() {
  const locale = await displayLocale();

  return (
    <AppDocument locale={locale}>
      <NotFoundView locale={locale} messages={getMessages(locale)} />
    </AppDocument>
  );
}
