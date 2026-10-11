"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudioWorkspace } from "@/components/workflow/studio-workspace";
import { getSession, logout, type AuthAccount } from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./auth-form.module.css";

type StudioPanelProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * The Professional Studio: a genuine signed-in workspace for Professionals and
 * the Admin. Stage E wires the shared structured project: fabrication settings,
 * live front view and dimensioned side view, saved on this device. The design
 * itself is edited in the customer creator; deeper tools remain labelled planned
 * on the /pro page — nothing here pretends to work.
 */
export function StudioPanel({ locale, messages }: StudioPanelProps) {
  const copy = messages.auth.studio;
  const router = useRouter();
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getSession(locale).then((session) => {
      if (cancelled) return;
      if (!session.authenticated || !session.account) {
        router.replace(`/${locale}/login`);
        return;
      }
      setAccount(session.account);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  async function handleSignOut() {
    await logout(locale);
    router.replace(`/${locale}/login`);
    router.refresh();
  }

  if (loading || account === null) {
    return (
      <div className={styles.panel}>
        <p className={styles.loading}>{messages.auth.admin.loading}</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.section}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.lead}>{copy.lead}</p>
        <p className={styles.hint}>
          {copy.signedInAs} <strong>{account.email}</strong>
        </p>
        <p className={styles.hint}>
          {copy.role}:{" "}
          <Badge tone={account.role === "admin" ? "info" : "neutral"}>
            {messages.auth.roles[account.role]}
          </Badge>
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => void handleSignOut()}>
            {copy.signOut}
          </Button>
        </div>
      </div>

      <StudioWorkspace locale={locale} messages={messages} />
    </div>
  );
}
