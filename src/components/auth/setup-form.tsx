"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button";
import { AuthApiError, setupCreateAdmin, setupFetchSalt } from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { validatePassword } from "@/lib/password";

import styles from "./auth-form.module.css";

type SetupFormProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * The one-time, unlinked initial admin setup. Gated by the setup secret on the
 * server; the password is pre-hashed in the browser, never sent in the clear.
 */
export function SetupForm({ locale, messages }: SetupFormProps) {
  const copy = messages.auth.setup;
  const [setupSecret, setSetupSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (validatePassword(password) !== null) {
      setError(messages.auth.login.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(copy.mismatch);
      return;
    }

    setSubmitting(true);
    try {
      const salt = await setupFetchSalt(locale, setupSecret);
      await setupCreateAdmin(locale, { setupSecret, email, salt, password });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof AuthApiError && caught.message ? caught.message : copy.submit);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className={styles.panel}>
        <h1 className={styles.title}>{copy.success}</h1>
        <p className={styles.lead}>{copy.successLead}</p>
        <div className={styles.actions}>
          <Link href={`/${locale}/login`} className={buttonClassName({ variant: "primary" })}>
            {copy.goToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.lead}>{copy.lead}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="setup-secret">
            {copy.secret}
          </label>
          <input
            id="setup-secret"
            className={styles.input}
            type="password"
            autoComplete="off"
            required
            value={setupSecret}
            onChange={(event) => setSetupSecret(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="setup-email">
            {copy.email}
          </label>
          <input
            id="setup-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="setup-password">
            {copy.password}
          </label>
          <input
            id="setup-password"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="setup-confirm">
            {copy.confirm}
          </label>
          <input
            id="setup-confirm"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>

        {error !== null && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="submit" disabled={submitting}>
            {submitting ? copy.submitting : copy.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
