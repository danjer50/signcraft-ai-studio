import type { Metadata } from "next";

import { AppDocument, appViewport } from "@/components/app-shell/app-document";
import { NotFoundLocaleVariants } from "@/components/not-found/not-found-locale-variants";
import { defaultLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import "@/styles/tokens.css";
import "@/styles/globals.css";

export const viewport = appViewport;

// Next.js adds `noindex` to not-found documents automatically; do not add a second
// robots meta tag on top of it.
export const metadata: Metadata = {
  title: getMessages(defaultLocale).notFound.title,
  description: getMessages(defaultLocale).notFound.body,
};

/**
 * The exported 404 document: it serves every URL that no route matches — unknown locales
 * such as /de and unknown paths such as /fr/does-not-exist. Static hosting serves one
 * 404.html, so the document is rendered in the default locale at build time and
 * `public/not-found-locale.js` sets the correct `lang`/`dir` and shows the matching
 * content variant in the browser. The response has status 404. See
 * docs/ARCHITECTURE.md, section 4.
 */
export default function GlobalNotFound() {
  return (
    <AppDocument locale={defaultLocale}>
      <NotFoundLocaleVariants />
      <script src="/not-found-locale.js" defer />
    </AppDocument>
  );
}
