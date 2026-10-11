"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  AuthApiError,
  loginWithPassword,
  redeemAccessCode,
  type AuthAccount,
} from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { validatePassword } from "@/lib/password";

import styles from "./auth-form.module.css";

type LoginFormProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * The one shared login form for Admin and Professional accounts, plus the Pro
 * access-code entry: the single customer-facing door to the Pro workspace. The
 * password is pre-hashed in the browser (PBKDF2, 600 000 iterations); only the
 * client hash is sent. On success the server sets the session cookie and the form
 * redirects to the space that matches the account's role.
 */
export function LoginForm({ locale, messages }: LoginFormProps) {
  const copy = messages.auth.login;
  const codeCopy = messages.auth.codes;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSubmitting, setCodeSubmitting] = useState(false);

  async function handleRedeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (codeSubmitting) return;
    setCodeError(null);
    setCodeSubmitting(true);
    try {
      // Server-side authorization: a valid, unrevoked, unexpired, non-exhausted
      // code opens a real session for a lightweight pro account.
      await redeemAccessCode(locale, code);
      router.push(`/${locale}/studio`);
    } catch (caught) {
      setCodeError(
        caught instanceof AuthApiError && caught.message ? caught.message : codeCopy.invalid,
      );
      setCodeSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (validatePassword(password) !== null) {
      setError(copy.passwordTooShort);
      return;
    }

    setSubmitting(true);
    try {
      const account: AuthAccount = await loginWithPassword(locale, email, password);
      router.push(account.role === "admin" ? `/${locale}/admin` : `/${locale}/studio`);
    } catch (caught) {
      setError(caught instanceof AuthApiError && caught.message ? caught.message : copy.error);
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.lead}>{copy.lead}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            {copy.email}
          </label>
          <input
            id="login-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-password">
            {copy.password}
          </label>
          <input
            id="login-password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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

      <form className={styles.form} onSubmit={handleRedeem} aria-label={codeCopy.legend}>
        <fieldset className={styles.field} data-testid="access-code-form">
          <legend className={styles.label}>{codeCopy.legend}</legend>
          <p className={styles.lead}>{codeCopy.hint}</p>
          <input
            className={styles.input}
            type="text"
            autoComplete="off"
            spellCheck={false}
            aria-label={codeCopy.legend}
            placeholder={codeCopy.placeholder}
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          {codeError !== null && (
            <p className={styles.error} role="alert">
              {codeError}
            </p>
          )}
          <div className={styles.actions}>
            <Button type="submit" variant="secondary" disabled={codeSubmitting}>
              {codeSubmitting ? codeCopy.submitting : codeCopy.submit}
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
