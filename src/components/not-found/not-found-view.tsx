import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./not-found-view.module.css";

/**
 * The content of the 404 page: a status code, a heading, an explanation and a way home.
 * It links only to the home page of the same locale, which always exists.
 */
export function NotFoundView({ locale, messages }: { locale: Locale; messages: Messages }) {
  const copy = messages.notFound;

  return (
    <div className={styles.panel}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>{copy.heading}</h1>
      <p className={styles.body}>{copy.body}</p>
      <div>
        <Link href={`/${locale}`} className={buttonClassName({ variant: "primary" })}>
          {copy.homeLink}
        </Link>
      </div>
    </div>
  );
}
