import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

import { NotFoundView } from "./not-found-view";
import styles from "./not-found-view.module.css";

/**
 * The 404 content in every locale. Static hosting serves one 404.html, so all three
 * variants ship in the document: the default locale is visible, the others are hidden.
 * `public/not-found-locale.js` shows the variant that matches the URL at runtime and
 * sets `lang`/`dir`; without JavaScript the default locale stays (documented limitation).
 */
export function NotFoundLocaleVariants() {
  return (
    <>
      {locales.map((locale: Locale) => {
        const messages = getMessages(locale);
        return (
          <div
            key={locale}
            data-notfound-locale={locale}
            data-notfound-title={messages.notFound.title}
            hidden={locale !== defaultLocale}
            className={styles.variant}
          >
            <NotFoundView locale={locale} messages={messages} />
          </div>
        );
      })}
    </>
  );
}
