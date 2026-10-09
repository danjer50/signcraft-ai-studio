import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { getDirection, isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import "@/styles/tokens.css";
import "@/styles/globals.css";

type LocaleParams = { params: Promise<{ locale: string }> };

// Only the locales listed in config are routable. Anything else returns 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#c2410c",
};

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
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
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body>
        <AppShell locale={locale} messages={getMessages(locale)}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
