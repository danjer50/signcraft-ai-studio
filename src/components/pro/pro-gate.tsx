"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession } from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import authStyles from "@/components/auth/auth-form.module.css";

import { ProView } from "./pro-view";

type ProGateProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * The /pro route is NOT public: the workspace is reachable only with a valid
 * session (pro or admin — opened by a Pro access code at Connection/Login, or by
 * a password login). Anonymous visitors are redirected to the login page, where
 * the access-code entry lives. Hiding the link from the menus is convenience;
 * this client gate plus the server-side session checks are the actual control.
 */
export function ProGate({ locale, messages }: ProGateProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSession(locale).then((session) => {
      if (cancelled) return;
      if (!session.authenticated) {
        router.replace(`/${locale}/login`);
        return;
      }
      setAuthenticated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  if (!authenticated) {
    return (
      <div className={authStyles.panel}>
        <p className={authStyles.loading}>{messages.auth.admin.loading}</p>
      </div>
    );
  }

  return <ProView locale={locale} messages={messages} />;
}
