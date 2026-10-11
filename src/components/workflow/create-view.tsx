import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Messages } from "@/i18n/messages/en";

import { SignPreviewDemo } from "./sign-preview-demo";
import { WorkflowSteps } from "./workflow-steps";
import styles from "./create-view.module.css";

/**
 * The customer creation page. It explains the four-step journey and runs the working
 * local demo for steps 1–3. Step 4 is labelled as planned and has no controls.
 */
export function CreateView({ messages }: { messages: Messages }) {
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{messages.create.title}</h1>
        <p className={styles.lead}>{messages.create.lead}</p>
      </div>

      <section aria-labelledby="create-steps-title" className={styles.section}>
        <h2 id="create-steps-title" className={styles.sectionTitle}>
          {messages.workflow.title}
        </h2>
        <p className={styles.sectionLead}>{messages.workflow.intro}</p>
        <WorkflowSteps messages={messages} />
      </section>

      <section aria-labelledby="create-demo-title" className={styles.section}>
        <div className={styles.demoHeader}>
          <h2 id="create-demo-title" className={styles.sectionTitle}>
            {messages.create.demoTitle}
          </h2>
          <Badge tone="info">{messages.status.inDemo}</Badge>
        </div>
        <p className={styles.sectionLead}>{messages.create.demoLead}</p>
        <SignPreviewDemo messages={messages} />
      </section>

      <Card as="section" className={styles.note}>
        <h2 className={styles.noteTitle}>{messages.create.limitationsTitle}</h2>
        <p className={styles.noteText}>{messages.create.limitationsBody}</p>
        <p className={styles.noteText}>{messages.create.referenceNote}</p>
      </Card>
    </div>
  );
}
