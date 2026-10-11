import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

import { ExamplesGallery } from "./examples-gallery";
import { Hero } from "./hero";
import { ProTeaser } from "./pro-teaser";
import { WorkflowSummary } from "./workflow-summary";
import styles from "./home-view.module.css";

type HomeViewProps = {
  locale: Locale;
  messages: Messages;
};

/**
 * The product landing page: hero, example styles, the customer workflow, and the
 * entry point for professional sign makers.
 */
export function HomeView({ locale, messages }: HomeViewProps) {
  return (
    <div className={styles.page}>
      <Hero locale={locale} messages={messages} />
      <ExamplesGallery messages={messages} />
      <WorkflowSummary locale={locale} messages={messages} />
      <ProTeaser locale={locale} messages={messages} />
    </div>
  );
}
