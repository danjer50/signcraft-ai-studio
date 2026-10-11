import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import { WorkflowSteps } from "@/components/workflow/workflow-steps";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import styles from "./workflow-summary.module.css";

/**
 * Homepage section: the four customer steps with the live preview demo called out,
 * and a call to action into the customer flow.
 */
export function WorkflowSummary({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <section aria-labelledby="workflow-title" className={styles.section}>
      <div className={styles.intro}>
        <h2 id="workflow-title" className={styles.title}>
          {messages.workflow.title}
        </h2>
        <p className={styles.lead}>{messages.workflow.intro}</p>
      </div>

      <WorkflowSteps messages={messages} />

      <div className={styles.actions}>
        <Link href={`/${locale}/create`} className={buttonClassName({ variant: "primary" })}>
          {messages.workflow.cta}
        </Link>
      </div>
    </section>
  );
}
