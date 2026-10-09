import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Messages } from "@/i18n/messages/en";

import styles from "./foundation-overview.module.css";

const moduleKeys = ["design2d", "geometry3d", "mockups", "persistence", "exports"] as const;

/**
 * Status page for the foundation build. It only describes what works today and labels
 * every product module as planned. It deliberately contains no controls for features
 * that do not exist yet.
 */
export function FoundationOverview({ messages }: { messages: Messages }) {
  return (
    <div className={styles.stack}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{messages.home.title}</h1>
        <p className={styles.lead}>{messages.home.intro}</p>
      </div>

      <Card as="section">
        <h2 className={styles.sectionTitle}>{messages.home.statusTitle}</h2>
        <p>{messages.home.statusBody}</p>
      </Card>

      <section aria-labelledby="planned-modules-title" className={styles.section}>
        <h2 id="planned-modules-title" className={styles.sectionTitle}>
          {messages.home.modulesTitle}
        </h2>
        <ul className={styles.moduleGrid}>
          {moduleKeys.map((key) => {
            const copy = messages.modules[key];
            return (
              <li key={key} className={styles.moduleItem}>
                <Card as="article" className={styles.moduleCard}>
                  <div className={styles.moduleHeader}>
                    <h3 className={styles.moduleTitle}>{copy.title}</h3>
                    <Badge>{messages.status.planned}</Badge>
                  </div>
                  <p className={styles.moduleText}>{copy.description}</p>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
