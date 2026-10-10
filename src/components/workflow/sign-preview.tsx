import type { CSSProperties } from "react";

import type { Messages } from "@/i18n/messages/en";
import type { ColourRole, LayoutId, TemplateId } from "@/templates/types";

import styles from "./sign-preview.module.css";

type SignPreviewProps = {
  messages: Messages;
  templateId: TemplateId;
  /** Localised template name, shown on the preview so the selection is visible. */
  templateName: string;
  layout: LayoutId;
  /** Resolved hex values for the colour slots. */
  colours: Record<ColourRole, string>;
  text: string;
  tagline: string;
};

/**
 * The live sign preview: a deterministic style composition of the typed text in the
 * selected template and colours. It is not AI-generated imagery and not a fabrication
 * model; the surrounding page states that explicitly. Template layouts come from
 * `data-layout`, colours from CSS custom properties, so every update is instant.
 */
export function SignPreview({
  messages,
  templateId,
  templateName,
  layout,
  colours,
  text,
  tagline,
}: SignPreviewProps) {
  const copy = messages.create;
  const signText = text.trim() || copy.previewFallback;
  const cssVariables = {
    "--sign-face": colours.face,
    "--sign-glow": colours.glow,
    "--sign-accent": colours.accent,
  } as CSSProperties;

  return (
    <figure className={styles.previewFrame}>
      <figcaption className={styles.previewTitle}>{copy.previewLabel}</figcaption>
      <div
        className={styles.preview}
        data-template={templateId}
        data-layout={layout}
        role="group"
        aria-label={copy.previewLabel}
        style={cssVariables}
      >
        <p className={styles.previewTemplateName}>{templateName}</p>
        <div className={styles.signScene}>
          <div className={styles.signBoard}>
            <p className={styles.signText}>{signText}</p>
            {tagline.trim() !== "" && <p className={styles.signTagline}>{tagline.trim()}</p>}
          </div>
        </div>
      </div>
      <p className={styles.previewCaption}>{copy.previewCaption}</p>
    </figure>
  );
}
