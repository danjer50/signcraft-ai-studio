import Image from "next/image";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./pro-teaser.module.css";

/**
 * Homepage band that opens the professional workspace. It is a labelled entry point
 * only: the advanced design and fabrication tools are planned, not built.
 */
export function ProTeaser({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <section aria-labelledby="pro-teaser-title" className={styles.band}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{messages.nav.pro}</p>
        <h2 id="pro-teaser-title" className={styles.title}>
          {messages.pro.title}
        </h2>
        <p className={styles.lead}>{messages.pro.lead}</p>
        <p className={styles.note}>{messages.pro.audience}</p>
        <div className={styles.actions}>
          <Link href={`/${locale}/pro`} className={buttonClassName({ variant: "secondary" })}>
            {messages.pro.openCta}
          </Link>
        </div>
      </div>
      <Image
        src="/images/pro-workshop.jpg"
        alt=""
        width={1280}
        height={853}
        sizes="(min-width: 48rem) 26rem, 90vw"
        className={styles.image}
      />
    </section>
  );
}
