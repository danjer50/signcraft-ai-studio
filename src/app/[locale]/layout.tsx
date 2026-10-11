import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppDocument, appViewport } from "@/components/app-shell/app-document";
import { locales } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";
import "@/styles/tokens.css";
import "@/styles/globals.css";

type LocaleParams = { params: Promise<{ locale: string }> };

// Only the locales listed in config are routable. Any other first segment, such as /de, is
// unmatched and renders app/global-not-found.tsx with a 404 status.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport = appViewport;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: messages.app.name,
    description: messages.app.description,
  };
}

/**
 * Root layout for every locale. It sets `lang` and `dir` on <html> on the server so
 * screen readers and the browser get the right language and direction from the first byte.
 */
export default async function LocaleLayout({
  children,
  params,
}: { children: ReactNode } & LocaleParams) {
  const locale = await localeFromRouteParams(params);

  return <AppDocument locale={locale}>{children}</AppDocument>;
}
