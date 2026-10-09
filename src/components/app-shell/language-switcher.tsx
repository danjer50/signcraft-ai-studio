import Link from "next/link";

import { localeNames, locales, type Locale } from "@/i18n/config";
import { replaceLocaleInPath } from "@/i18n/locale-path";
import { cx } from "@/lib/cx";

import { useCurrentPathname } from "./current-pathname";
import styles from "./language-switcher.module.css";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
  /** Stretch the options across the available width, as in the drawer. */
  fill?: boolean;
};

/**
 * Plain links to the same page in each language. Works without JavaScript and keeps
 * the user on an equivalent page. Each option carries its own lang attribute so the
 * name is rendered in the right script.
 */
export function LanguageSwitcher({ currentLocale, label, fill = false }: LanguageSwitcherProps) {
  const pathname = useCurrentPathname();

  return (
    <div role="group" aria-label={label} className={cx(styles.switcher, fill && styles.fill)}>
      <ul className={styles.list}>
        {locales.map((locale) => {
          const isCurrent = locale === currentLocale;
          return (
            <li key={locale}>
              <Link
                href={replaceLocaleInPath(pathname, locale)}
                hrefLang={locale}
                lang={locale}
                aria-current={isCurrent ? "true" : undefined}
                className={styles.option}
              >
                {localeNames[locale]}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
