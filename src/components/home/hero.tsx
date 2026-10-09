import Image from "next/image";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./hero.module.css";

type HeroProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * Landing hero: the product headline over a signage photograph, with the two real
 * calls to action — the customer flow and the example gallery further down the page.
 */
export function Hero({ locale, messages }: HeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Image
        src="/images/hero-storefront.jpg"
        alt=""
        fill
        sizes="100vw"
        priority
        className={styles.image}
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.eyebrow}>{messages.app.tagline}</p>
        <h1 id="hero-title" className={styles.title}>
          {messages.home.title}
        </h1>
        <p className={styles.lead}>{messages.home.lead}</p>
        <div className={styles.actions}>
          <Link href={`/${locale}/create`} className={buttonClassName({ variant: "primary" })}>
            {messages.home.primaryCta}
          </Link>
          <a href="#examples" className={buttonClassName({ variant: "secondary" })}>
            {messages.home.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
