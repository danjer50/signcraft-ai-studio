"use client";

import { useId, useState } from "react";

import type { Messages } from "@/i18n/messages/en";
import { getTemplate } from "@/templates/catalogue";
import {
  defaultDraft,
  draftWithTemplate,
  resolveColourValues,
  MAX_TAGLINE_LENGTH,
  MAX_TEXT_LENGTH,
  type CustomerDraft,
} from "@/templates/draft";
import type { ColourId, ColourRole, TemplateId } from "@/templates/types";

import { ColourPicker } from "./colour-picker";
import { SignPreview } from "./sign-preview";
import { TemplatePicker } from "./template-picker";
import styles from "./sign-preview-demo.module.css";

/**
 * A working local demonstration of the first customer steps: describing a sign
 * (business name and optional tagline), choosing a template and customising its
 * colours. The preview is a deterministic style composition of the typed text —
 * not an AI-generated design and not a fabrication model; the panel below says so
 * explicitly. Every change updates the preview instantly. It has no submit action:
 * requesting changes and continuing are planned (step 4 of the workflow).
 *
 * The state is a serialisable CustomerDraft, the seam for the future transfer of a
 * customer's customisation into the Professional Studio.
 */
export function SignPreviewDemo({ messages }: { messages: Messages }) {
  const copy = messages.create;
  const textId = useId();
  const taglineId = useId();

  const [draft, setDraft] = useState<CustomerDraft>(() => defaultDraft());
  const template = getTemplate(draft.templateId);
  const colours = resolveColourValues(draft);

  const setTemplate = (templateId: TemplateId) => {
    setDraft((current) => draftWithTemplate(current, templateId));
  };
  const setColour = (role: ColourRole, colourId: ColourId) => {
    setDraft((current) => ({
      ...current,
      colours: { ...current.colours, [role]: colourId },
    }));
  };

  return (
    <div className={styles.demo}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={textId}>
            {copy.textLabel}
          </label>
          <input
            id={textId}
            type="text"
            className={styles.input}
            value={draft.text}
            maxLength={MAX_TEXT_LENGTH}
            placeholder={copy.textPlaceholder}
            onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={taglineId}>
            {copy.taglineLabel}
          </label>
          <input
            id={taglineId}
            type="text"
            className={styles.input}
            value={draft.tagline}
            maxLength={MAX_TAGLINE_LENGTH}
            placeholder={copy.taglinePlaceholder}
            onChange={(event) =>
              setDraft((current) => ({ ...current, tagline: event.target.value }))
            }
          />
        </div>

        <TemplatePicker messages={messages} value={draft.templateId} onChange={setTemplate} />

        <ColourPicker
          messages={messages}
          template={template}
          value={draft.colours}
          onChange={setColour}
        />
      </div>

      <SignPreview
        messages={messages}
        templateId={draft.templateId}
        templateName={messages.templates.items[draft.templateId].name}
        layout={template.layout}
        colours={colours}
        text={draft.text}
        tagline={draft.tagline}
      />
    </div>
  );
}
