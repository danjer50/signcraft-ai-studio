"use client";

import { useId } from "react";

import { signTemplates } from "@/templates/catalogue";
import { defaultColourValues } from "@/templates/palette";
import type { Messages } from "@/i18n/messages/en";
import type { TemplateId } from "@/templates/types";

import { SignPreview } from "./sign-preview";
import styles from "./template-gallery.module.css";

type TemplateGalleryProps = {
  messages: Messages;
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  /** The customer's current text, shown in the cards so the preview is realistic. */
  text: string;
  tagline: string;
};

/**
 * The Normal Mode template gallery: a responsive grid of complete sign designs.
 * Every card previews the whole composition — emblem, frame, arrangement, lettering
 * and scene — with the template's default colours, so a customer browses finished
 * designs, not blank panels. Each card carries a real radio input, so selection is
 * keyboard-accessible and the choice updates the preview instantly.
 */
export function TemplateGallery({
  messages,
  value,
  onChange,
  text,
  tagline,
}: TemplateGalleryProps) {
  const groupName = useId();
  const copy = messages.templates;
  const sampleName = text.trim() !== "" ? text : copy.sampleName;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>{copy.galleryLegend}</legend>
      <p className={styles.hint}>{copy.galleryHint}</p>
      <div className={styles.grid}>
        {signTemplates.map((template) => {
          const item = messages.templates.items[template.id];
          const previewText = sampleName;
          return (
            <label key={template.id} className={styles.card} data-selected={value === template.id}>
              <input
                type="radio"
                name={groupName}
                value={template.id}
                checked={value === template.id}
                onChange={() => onChange(template.id)}
                className={styles.radio}
              />
              <SignPreview
                messages={messages}
                templateId={template.id}
                templateName={item.name}
                layout={template.layout}
                colours={defaultColourValues(template)}
                text={previewText}
                tagline={tagline}
                composition={template.composition}
                lettering={template.composition.lettering}
                mini
              />
              <span className={styles.cardMeta}>
                <span className={styles.cardName}>{item.name}</span>
                <span className={styles.cardCategory}>{copy.categories[template.category]}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
