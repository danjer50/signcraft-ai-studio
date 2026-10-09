import Link from "next/link";
import type { Ref } from "react";

import { Badge } from "@/components/ui/badge";
import {
  CanvasIcon,
  CubeIcon,
  DownloadIcon,
  FolderIcon,
  HomeIcon,
  SparkleIcon,
} from "@/components/ui/icons";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import { useCurrentPathname } from "./current-pathname";
import { LanguageSwitcher } from "./language-switcher";
import { navigationHref, navigationItems, type NavKey } from "./navigation-items";
import styles from "./primary-navigation.module.css";

const icons = {
  home: HomeIcon,
  projects: FolderIcon,
  design2d: CanvasIcon,
  geometry3d: CubeIcon,
  mockups: SparkleIcon,
  exports: DownloadIcon,
} satisfies Record<NavKey, typeof HomeIcon>;

type PrimaryNavigationProps = {
  id: string;
  open: boolean;
  locale: Locale;
  messages: Messages;
  ref?: Ref<HTMLElement>;
};

/**
 * One navigation list. It is a sidebar on desktop and an off-canvas drawer on mobile.
 * CSS decides which, and hides the drawer from assistive technology while it is closed.
 */
export function PrimaryNavigation({ id, open, locale, messages, ref }: PrimaryNavigationProps) {
  const pathname = useCurrentPathname();

  return (
    <nav
      ref={ref}
      id={id}
      aria-label={messages.common.primaryNavigation}
      data-open={open ? "true" : "false"}
      className={styles.nav}
    >
      <ul className={styles.list}>
        {navigationItems.map((item) => {
          const Icon = icons[item.key];
          const label = messages.nav[item.key];

          if (!item.available) {
            return (
              <li key={item.key}>
                <span className={styles.planned}>
                  <Icon />
                  <span className={styles.label}>{label}</span>
                  <Badge>{messages.status.planned}</Badge>
                </span>
              </li>
            );
          }

          const href = navigationHref(locale, item);
          const isCurrent = pathname === href;

          return (
            <li key={item.key}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={styles.link}
              >
                <Icon />
                <span className={styles.label}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.languages}>
        <p className={styles.languagesLabel}>{messages.common.language}</p>
        <LanguageSwitcher currentLocale={locale} label={messages.common.language} fill />
      </div>
    </nav>
  );
}
