"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  AuthApiError,
  setPasswordFetchSalt,
  setPasswordWithToken,
  type AuthAccount,
} from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { validatePassword } from "@/lib/password";

import styles from "./auth-form.module.css";

type SetPasswordFormProps = {
  locale: Locale;
  messages: Messages;
  token: string;
};

/**
 * The invitation flow: the professional sets their password with the one-time token
 * from the invitation link. The password is pre-hashed in the browser; on success
 * the server sets the session cookie and the form redirects to the Pro Studio.
 */
export function SetPasswordForm({ locale, messages, token }: SetPasswordFormProps) {
  const copy = messages.auth.setPassword;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [salt, setSalt] = useState<string | null>(null);

  // Validate the token as soon as the page opens, so an invalid or expired link fails
  // before the professional types anything.
  useEffect(() => {
    let cancelled = false;
    void setPasswordFetchSalt(locale, token)
      .then((value) => {
        if (!cancelled) {
          setSalt(value);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        if (caught instanceof AuthApiError && caught.code === "invalid_token") {
          setInvalidToken(true);
        } else {
          setError(
            caught instanceof AuthApiError && caught.message ? caught.message : copy.invalidToken,
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale, token, copy.invalidToken]);

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
      const account: AuthAccount = await setPasswordWithToken(locale, token, password, salt);
      router.push(account.role === "admin" ? `/${locale}/admin` : `/${locale}/studio`);
    } catch (caught) {
      if (caught instanceof AuthApiError && caught.status === 401) {
        setInvalidToken(true);
      } else {
        setError(caught instanceof AuthApiError && caught.message ? caught.message : copy.submit);
      }
      setSubmitting(false);
    }
  }

  if (invalidToken) {
    return (
      <div className={styles.panel}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.error} role="alert">
          {copy.invalidToken}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.lead}>{copy.lead}</p>

      {salt === null && !invalidToken && error === null && (
        <p className={styles.loading}>{messages.auth.admin.loading}</p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="set-password">
            {copy.password}
          </label>
          <input
            id="set-password"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="set-password-confirm">
            {copy.confirm}
          </label>
          <input
            id="set-password-confirm"
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
