"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { BrandMark, MenuIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import { useCurrentPathname } from "./current-pathname";
import { LanguageSwitcher } from "./language-switcher";
import { PrimaryNavigation } from "./primary-navigation";
import styles from "./app-shell.module.css";

const NAVIGATION_ID = "primary-navigation";
/** At this width the navigation is a permanent sidebar and the drawer state does not apply. */
const DESKTOP_QUERY = "(min-width: 64rem)";

type AppShellProps = {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
};

export function AppShell({ locale, messages, children }: AppShellProps) {
  const pathname = useCurrentPathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

  // Close the drawer after navigation. Adjusting state during render is React's
  // recommended pattern for resetting state when a prop changes.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  // Escape closes the drawer. Focus returns to the menu button if it was inside the drawer.
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const focusWasInDrawer = navigationRef.current?.contains(document.activeElement) ?? false;
      setMenuOpen(false);
      if (focusWasInDrawer) {
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // While the drawer is open on small screens, stop the page behind it from scrolling. If the
  // window grows to desktop width, the sidebar takes over, so close the drawer and release the lock.
  useEffect(() => {
    if (!menuOpen) return;

    const desktopQuery = window.matchMedia(DESKTOP_QUERY);
    const closeAtDesktopWidth = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    desktopQuery.addEventListener("change", closeAtDesktopWidth);

    const { style } = document.documentElement;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";
    return () => {
      desktopQuery.removeEventListener("change", closeAtDesktopWidth);
      style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        {messages.common.skipToContent}
      </a>

      <header className={styles.header}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-controls={NAVIGATION_ID}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon />
          <span>{messages.common.menu}</span>
        </button>

        <Link href={`/${locale}`} className={styles.brand}>
          <BrandMark />
          <span className={styles.brandName}>{messages.app.name}</span>
        </Link>

        <span className={styles.buildLabel}>{messages.app.buildLabel}</span>

        <div className={styles.switcherSlot}>
          <LanguageSwitcher currentLocale={locale} label={messages.common.language} />
        </div>
      </header>

      <PrimaryNavigation
        ref={navigationRef}
        id={NAVIGATION_ID}
        open={menuOpen}
        locale={locale}
        messages={messages}
      />

      <div
        className={styles.scrim}
        data-open={menuOpen ? "true" : "false"}
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
      />

      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
