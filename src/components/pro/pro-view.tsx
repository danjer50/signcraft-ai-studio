import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./pro-view.module.css";

const toolKeys = ["design2d", "geometry3d", "mockups", "persistence", "exports"] as const;

/**
 * Entry point for the professional SignCraft workspace. It describes the planned
 * design and fabrication tools honestly — every capability is labelled as planned and
 * there is no editor on this page.
 */
export function ProView({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{messages.nav.pro}</p>
        <h1 className={styles.title}>{messages.pro.title}</h1>
        <p className={styles.lead}>{messages.pro.lead}</p>
      </div>

      <Image
        src="/images/pro-workshop.jpg"
        alt=""
        width={1280}
        height={853}
        sizes="(min-width: 64rem) 64rem, 90vw"
        priority
        className={styles.image}
      />

      <Card as="section" className={styles.audience}>
        <h2 className={styles.audienceTitle}>{messages.pro.audienceTitle}</h2>
        <p className={styles.noteText}>{messages.pro.audience}</p>
      </Card>

      <section aria-labelledby="pro-tools-title" className={styles.section}>
        <h2 id="pro-tools-title" className={styles.sectionTitle}>
          {messages.pro.toolsTitle}
        </h2>
        <ul className={styles.toolGrid}>
          {toolKeys.map((key) => {
            const copy = messages.modules[key];
            return (
              <li key={key}>
                <Card as="article" className={styles.toolCard}>
                  <div className={styles.toolHeader}>
                    <h3 className={styles.toolTitle}>{copy.title}</h3>
                    <Badge>{messages.status.planned}</Badge>
                  </div>
                  <p className={styles.noteText}>{copy.description}</p>
                </Card>
              </li>
            );
          })}
        </ul>
        <p className={styles.noteText}>{messages.pro.entryNote}</p>
      </section>

      <div className={styles.actions}>
        <Link href={`/${locale}/create`} className={buttonClassName({ variant: "secondary" })}>
          {messages.pro.cta}
        </Link>
      </div>
    </div>
  );
}
