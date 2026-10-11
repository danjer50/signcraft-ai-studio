import { Badge } from "@/components/ui/badge";
import type { Messages } from "@/i18n/messages/en";

import styles from "./workflow-steps.module.css";

const steps = ["step1", "step2", "step3", "step4"] as const;

/**
 * The customer journey, one step per list item. Steps 1–3 exist in the live preview
 * demo today; step 4 is labelled as planned and offers no controls.
 */
export function WorkflowSteps({ messages }: { messages: Messages }) {
  return (
    <ol className={styles.list} aria-label={messages.workflow.stepsLabel}>
      {steps.map((key, index) => {
        const step = messages.workflow[key];
        const isPlanned = key === "step4";
        return (
          <li key={key} className={styles.step} data-planned={isPlanned ? "true" : "false"}>
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
            <div className={styles.body}>
              <div className={styles.header}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <Badge tone={isPlanned ? "neutral" : "info"}>
                  {isPlanned ? messages.status.planned : messages.status.inDemo}
                </Badge>
              </div>
              <p className={styles.stepText}>{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
