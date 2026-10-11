"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCurrentPathname } from "@/components/app-shell/current-pathname";
import { getSession, logout, type SessionInfo } from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./nav-auth.module.css";

type NavAuthProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * The auth state in the header: a "Sign in" link for anonymous visitors, and for a
 * signed-in account a link to its space (Admin Space or Pro Studio) plus a sign-out
 * button. The customer space stays free — signing in is never required to use it.
 */
export function NavAuth({ locale, messages }: NavAuthProps) {
  const copy = messages.auth.nav;
  const pathname = useCurrentPathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  // Re-probe on every route change: a client-side login or logout must update the
  // header without a full reload.
  useEffect(() => {
    let cancelled = false;
    void getSession(locale).then((value) => {
      if (!cancelled) {
        setSession(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale, pathname]);

  async function handleSignOut() {
    await logout(locale);
    setSession({ authenticated: false });
    // Signing out from a gated page leaves it: the session it displayed is gone.
    if (pathname === `/${locale}/admin` || pathname === `/${locale}/studio`) {
      router.replace(`/${locale}/login`);
    }
  }

  if (session === null) {
    // First paint (and no-JS): render nothing rather than flash the wrong state.
    return <div className={styles.slot} aria-hidden="true" />;
  }

  if (!session.authenticated || !session.account) {
    return (
      <div className={styles.slot}>
        <Link href={`/${locale}/login`} className={styles.signIn}>
          {copy.signIn}
        </Link>
      </div>
    );
  }

  const spaceHref = session.account.role === "admin" ? `/${locale}/admin` : `/${locale}/studio`;
  const spaceLabel = session.account.role === "admin" ? copy.adminSpace : copy.proStudio;

  return (
    <div className={styles.slot}>
      <Link href={spaceHref} className={styles.spaceLink}>
        {spaceLabel}
      </Link>
      <button type="button" className={styles.signOut} onClick={() => void handleSignOut()}>
        {copy.signOut}
      </button>
    </div>
  );
}
