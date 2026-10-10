"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { getSession, logout, type AuthAccount } from "@/lib/auth-client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./auth-form.module.css";

type StudioPanelProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * The Professional Studio (Milestone 5): a genuine signed-in workspace for
 * Professionals and the Admin. The manual editing tools are a later milestone, so
 * they are labelled as planned — nothing here pretends to work.
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
          <Link href={`/${locale}/create`} className={buttonClassName({ variant: "primary" })}>
            {copy.createCta}
          </Link>
        </div>
      </div>

      <section className={styles.section} aria-labelledby="studio-planned-title">
        <h2 className={styles.sectionTitle} id="studio-planned-title">
          {copy.plannedTitle} <Badge>{messages.status.planned}</Badge>
        </h2>
        <p className={styles.hint}>{copy.plannedBody}</p>
      </section>
    </div>
  );
}
