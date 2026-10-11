"use client";

import { useSearchParams } from "next/navigation";

import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import { SetPasswordForm } from "./set-password-form";
import styles from "./auth-form.module.css";

type SetPasswordViewProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * Reads the invitation token from the query string and renders the set-password
 * form. A missing token shows the invalid-link panel. Wrapped in a Suspense boundary
 * by the page, because useSearchParams needs one in a static export.
 */
export function SetPasswordView({ locale, messages }: SetPasswordViewProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const copy = messages.auth.setPassword;

  if (token === "") {
    return (
      <div className={styles.panel}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.error} role="alert">
          {copy.invalidToken}
        </p>
      </div>
    );
  }

  return <SetPasswordForm locale={locale} messages={messages} token={token} />;
}
