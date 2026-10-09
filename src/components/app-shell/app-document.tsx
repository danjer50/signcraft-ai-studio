import type { Viewport } from "next";
import type { ReactNode } from "react";

import { getDirection, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

import { AppShell } from "./app-shell";

/** Viewport settings shared by every document, so the locale pages and the 404 page match. */
export const appViewport: Viewport = {
  themeColor: "#c2410c",
};

/**
 * The complete HTML document for one locale: `<html lang dir>`, the body and the app shell.
 * The locale layout and the global not-found page both render through this component, so
 * they cannot drift apart.
 */
export function AppDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
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
