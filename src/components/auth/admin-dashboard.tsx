"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AuthApiError,
  createAccessCode,
  getSession,
  inviteProfessional,
  listAccessCodes,
  listAccounts,
  logout,
  manageAccount,
  revokeAccessCode,
  type AccessCodeSummary,
  type AuthAccount,
} from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./auth-form.module.css";

type AdminDashboardProps = {
  locale: Locale;
  messages: Messages;
};

type AccountStatus = "invited" | "active" | "suspended" | "revoked";

type DashboardData =
  | { kind: "ready"; email: string; accounts: AuthAccount[] }
  | { kind: "redirect"; href: string }
  | { kind: "error" };

/** Loads the session and the account list. Pure: no state, so effects can call it safely. */
async function fetchDashboard(locale: Locale): Promise<DashboardData> {
  // The session decides first: anonymous visitors go to the login page, and a signed
  // in non-admin goes to their own space. The account list is only fetched for admins.
  const session = await getSession(locale);
  if (!session.authenticated || !session.account) {
    return { kind: "redirect", href: `/${locale}/login` };
  }
  if (session.account.role !== "admin") {
    return { kind: "redirect", href: `/${locale}/studio` };
  }
  try {
    const accountList = await listAccounts(locale);
    return { kind: "ready", email: session.account.email, accounts: accountList };
  } catch {
    return { kind: "error" };
  }
}

/**
 * The Admin Space: account management for Admin accounts only. The page itself is
 * gated client-side (the session cookie decides); the API re-checks the role on
 * every call, so a Professional can never reach this data.
 */
export function AdminDashboard({ locale, messages }: AdminDashboardProps) {
  const copy = messages.auth.admin;
  const codeCopy = messages.auth.adminCodes;
  const roleCopy = messages.auth.roles;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Pro access codes (Stage D): the admin mints the codes; redemption happens on
  // the public login page and never touches admin privileges.
  const [codes, setCodes] = useState<AccessCodeSummary[]>([]);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [codeLabel, setCodeLabel] = useState("");
  const [codeMaxUses, setCodeMaxUses] = useState("1");
  const [codeExpiry, setCodeExpiry] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);

  const applyResult = useCallback(
    (result: DashboardData) => {
      if (result.kind === "redirect") {
        router.replace(result.href);
        return;
      }
      if (result.kind === "error") {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setCurrentEmail(result.email);
      setAccounts(result.accounts);
      setLoading(false);
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchDashboard(locale).then((result) => {
      if (!cancelled) {
        applyResult(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale, applyResult]);

  // Used after invites and account actions to refresh the list.
  const refresh = useCallback(async () => {
    applyResult(await fetchDashboard(locale));
  }, [locale, applyResult]);

  const refreshCodes = useCallback(async () => {
    try {
      setCodes(await listAccessCodes(locale));
    } catch {
      setCodeError(codeCopy.title);
    }
  }, [locale, codeCopy.title]);

  useEffect(() => {
    if (loading || loadError) {
      return;
    }
    let cancelled = false;
    void listAccessCodes(locale)
      .then((list) => {
        if (!cancelled) {
          setCodes(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCodeError(codeCopy.title);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loading, loadError, locale, codeCopy.title]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviting) return;
    setInviteError(null);
    setInviteToken(null);
    setCopied(false);
    setInviting(true);
    try {
      const token = await inviteProfessional(locale, inviteEmail);
      setInviteToken(token);
      setInviteEmail("");
      await refresh();
    } catch (caught) {
      setInviteError(
        caught instanceof AuthApiError && caught.message ? caught.message : copy.inviteSubmit,
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleAction(accountId: string, action: "suspend" | "restore" | "revoke") {
    setActionError(null);
    setConfirming(null);
    try {
      await manageAccount(locale, accountId, action);
      await refresh();
    } catch (caught) {
      setActionError(
        caught instanceof AuthApiError && caught.message ? caught.message : copy.loading,
      );
    }
  }

  async function handleCreateCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (codeBusy) return;
    setCodeError(null);
    setNewCode(null);
    setCodeBusy(true);
    try {
      const created = await createAccessCode(locale, {
        label: codeLabel.trim() === "" ? undefined : codeLabel.trim(),
        maxUses: Number(codeMaxUses),
        expiresInHours: codeExpiry.trim() === "" ? undefined : Number(codeExpiry),
      });
      setNewCode(created.code);
      setCodeLabel("");
      setCodeMaxUses("1");
      setCodeExpiry("");
      await refreshCodes();
    } catch (caught) {
      setCodeError(
        caught instanceof AuthApiError && caught.message ? caught.message : codeCopy.create,
      );
    } finally {
      setCodeBusy(false);
    }
  }

  async function handleRevokeCode(id: string) {
    setCodeError(null);
    setCodeBusy(true);
    try {
      await revokeAccessCode(locale, id);
      await refreshCodes();
    } catch (caught) {
      setCodeError(
        caught instanceof AuthApiError && caught.message ? caught.message : codeCopy.revoke,
      );
    } finally {
      setCodeBusy(false);
    }
  }

  async function handleSignOut() {
    await logout(locale);
    router.replace(`/${locale}/login`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className={styles.panel}>
        <p className={styles.loading}>{copy.loading}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.panel}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.error} role="alert">
          {copy.loadError}
        </p>
      </div>
    );
  }

  const inviteLink = inviteToken !== null ? `/${locale}/set-password?token=${inviteToken}` : null;

  return (
    <div className={styles.dashboard}>
      <div className={styles.section}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.lead}>{copy.lead}</p>
        {currentEmail !== null && (
          <p className={styles.hint}>
            {copy.signedInAs} <strong>{currentEmail}</strong>
          </p>
        )}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => void handleSignOut()}>
            {messages.auth.nav.signOut}
          </Button>
        </div>
      </div>

      <section className={styles.section} aria-labelledby="admin-accounts-title">
        <h2 className={styles.sectionTitle} id="admin-accounts-title">
          {copy.accounts}
        </h2>
        {accounts.length === 0 ? (
          <p className={styles.muted}>{copy.empty}</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{copy.email}</th>
                  <th scope="col">{copy.role}</th>
                  <th scope="col">{copy.status}</th>
                  <th scope="col">{copy.lastLogin}</th>
                  <th scope="col">{copy.accounts}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const status = account.status as AccountStatus;
                  const isSelf = account.email === currentEmail;
                  const isAdmin = account.role === "admin";
                  const busy =
                    confirming === `${account.id}:suspend` || confirming === `${account.id}:revoke`;
                  return (
                    <tr key={account.id}>
                      <td>{account.email}</td>
                      <td>
                        <Badge tone={isAdmin ? "info" : "neutral"}>{roleCopy[account.role]}</Badge>
                      </td>
                      <td>
                        <Badge
                          tone={
                            status === "active"
                              ? "success"
                              : status === "suspended"
                                ? "warning"
                                : status === "revoked"
                                  ? "danger"
                                  : "neutral"
                          }
                        >
                          {copy.statuses[status]}
                        </Badge>
                      </td>
                      <td className={styles.muted}>
                        {account.last_login_at
                          ? new Date(account.last_login_at).toLocaleString(locale)
                          : copy.never}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          {status === "suspended" && !isSelf && !isAdmin && (
                            <Button
                              variant="secondary"
                              onClick={() => void handleAction(account.id, "restore")}
                            >
                              {copy.restore}
                            </Button>
                          )}
                          {(status === "active" || status === "invited") && !isSelf && !isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                disabled={busy}
                                onClick={() =>
                                  confirming === `${account.id}:suspend`
                                    ? void handleAction(account.id, "suspend")
                                    : setConfirming(`${account.id}:suspend`)
                                }
                              >
                                {confirming === `${account.id}:suspend`
                                  ? copy.confirmSuspend
                                  : copy.suspend}
                              </Button>
                              <Button
                                variant="ghost"
                                disabled={busy}
                                onClick={() =>
                                  confirming === `${account.id}:revoke`
                                    ? void handleAction(account.id, "revoke")
                                    : setConfirming(`${account.id}:revoke`)
                                }
                              >
                                {confirming === `${account.id}:revoke`
                                  ? copy.confirmRevoke
                                  : copy.revoke}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {actionError !== null && (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="admin-invite-title">
        <h2 className={styles.sectionTitle} id="admin-invite-title">
          {copy.inviteTitle}
        </h2>
        <p className={styles.hint}>{copy.inviteLead}</p>
        <form className={styles.form} onSubmit={handleInvite}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-email">
              {copy.inviteEmail}
            </label>
            <input
              id="invite-email"
              className={styles.input}
              type="email"
              autoComplete="off"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </div>
          {inviteError !== null && (
            <p className={styles.error} role="alert">
              {inviteError}
            </p>
          )}
          <div className={styles.actions}>
            <Button type="submit" disabled={inviting}>
              {inviting ? copy.inviteSubmitting : copy.inviteSubmit}
            </Button>
          </div>
        </form>

        {inviteLink !== null && (
          <div className={styles.inviteLink}>
            <p className={styles.hint}>{copy.inviteCreated}</p>
            <p className={styles.inviteLinkText}>{inviteLink}</p>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(`${window.location.origin}${inviteLink}`);
                  setCopied(true);
                }}
              >
                {copied ? copy.copied : copy.copyLink}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="admin-codes-title">
        <h2 className={styles.sectionTitle} id="admin-codes-title">
          {codeCopy.title}
        </h2>
        <p className={styles.hint}>{codeCopy.lead}</p>

        <form className={styles.form} onSubmit={handleCreateCode}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="code-label">
              {codeCopy.label}
            </label>
            <input
              id="code-label"
              className={styles.input}
              type="text"
              autoComplete="off"
              value={codeLabel}
              onChange={(event) => setCodeLabel(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="code-max-uses">
              {codeCopy.maxUses}
            </label>
            <input
              id="code-max-uses"
              className={styles.input}
              type="number"
              min={1}
              max={100}
              required
              value={codeMaxUses}
              onChange={(event) => setCodeMaxUses(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="code-expiry">
              {codeCopy.expiresInHours}
            </label>
            <input
              id="code-expiry"
              className={styles.input}
              type="number"
              min={1}
              max={8760}
              value={codeExpiry}
              onChange={(event) => setCodeExpiry(event.target.value)}
            />
          </div>
          {codeError !== null && (
            <p className={styles.error} role="alert">
              {codeError}
            </p>
          )}
          <div className={styles.actions}>
            <Button type="submit" disabled={codeBusy}>
              {codeCopy.create}
            </Button>
          </div>
        </form>

        {newCode !== null && (
          <div className={styles.inviteLink}>
            <p className={styles.hint}>{codeCopy.created}</p>
            <p className={styles.inviteLinkText} data-testid="new-access-code">
              {newCode}
            </p>
          </div>
        )}

        {codes.length === 0 ? (
          <p className={styles.muted}>{codeCopy.empty}</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{codeCopy.list}</th>
                  <th scope="col">{codeCopy.uses}</th>
                  <th scope="col">{copy.status}</th>
                  <th scope="col">{codeCopy.revoke}</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id}>
                    <td>{code.label ?? "—"}</td>
                    <td>
                      {code.uses}/{code.max_uses}
                    </td>
                    <td>
                      <Badge
                        tone={
                          code.state === "active"
                            ? "success"
                            : code.state === "expired"
                              ? "warning"
                              : code.state === "revoked"
                                ? "danger"
                                : "neutral"
                        }
                      >
                        {codeCopy.statuses[code.state]}
                      </Badge>
                    </td>
                    <td>
                      {code.state === "active" && (
                        <Button
                          variant="ghost"
                          disabled={codeBusy}
                          onClick={() => void handleRevokeCode(code.id)}
                        >
                          {codeCopy.revoke}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
