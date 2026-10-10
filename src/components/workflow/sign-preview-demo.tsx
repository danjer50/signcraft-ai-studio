"use client";

import { useEffect, useId, useState } from "react";

import type { Messages } from "@/i18n/messages/en";
import { getPhoto, intakePhoto, releaseAllPhotos, releasePhoto } from "@/projects/photo-store";
import type { PhotoError } from "@/projects/photo-validation";
import { getTemplate } from "@/templates/catalogue";
import {
  clearSelection,
  defaultDraft,
  draftWithPhoto,
  draftWithSelection,
  draftWithTemplate,
  resolveColourValues,
  MAX_TAGLINE_LENGTH,
  MAX_TEXT_LENGTH,
  type CustomerDraft,
} from "@/templates/draft";
import type { ColourId, ColourRole, NormalizedRect, TemplateId } from "@/templates/types";

import { ColourPicker } from "./colour-picker";
import { SignAreaPicker } from "./sign-area-picker";
import { SignPreview } from "./sign-preview";
import { TemplatePicker } from "./template-picker";
import styles from "./sign-preview-demo.module.css";

/**
 * A working local demonstration of the first customer steps: describing a sign
 * (business name and optional tagline), uploading a storefront photo and marking
 * the sign area, choosing a template and customising its colours. The photo is
 * validated, measured and stored locally — it is never uploaded — and the preview
 * is a deterministic style composition of the typed text: not an AI-generated
 * design, not a composite on the photo, and not a fabrication model; the panel
 * below says so explicitly. Every change updates instantly. It has no submit
 * action: requesting changes and continuing are planned (step 4 of the workflow).
 *
 * The state is a serialisable CustomerDraft (template, text, colours, photo
 * metadata, normalised selection), the seam for the future transfer of a
 * customer's customisation into the Professional Studio.
 */
export function SignPreviewDemo({ messages }: { messages: Messages }) {
  const copy = messages.create;
  const textId = useId();
  const taglineId = useId();

  const [draft, setDraft] = useState<CustomerDraft>(() => defaultDraft());
  const [photoError, setPhotoError] = useState<PhotoError | null>(null);
  const template = getTemplate(draft.templateId);
  const colours = resolveColourValues(draft);
  const storedPhoto = draft.photo ? getPhoto(draft.photo.id) : null;

  // The photo store is session memory: release it when the demo unmounts.
  useEffect(() => releaseAllPhotos, []);

  const setTemplate = (templateId: TemplateId) => {
    setDraft((current) => draftWithTemplate(current, templateId));
  };
  const setColour = (role: ColourRole, colourId: ColourId) => {
    setDraft((current) => ({
      ...current,
      colours: { ...current.colours, [role]: colourId },
    }));
  };
  const selectPhoto = async (file: File) => {
    const result = await intakePhoto(file);
    if (result.ok) {
      setPhotoError(null);
      setDraft((current) => draftWithPhoto(current, result.photo.meta));
    } else {
      setPhotoError(result.error);
    }
  };
  const removePhoto = () => {
    setDraft((current) => {
      if (current.photo) {
        releasePhoto(current.photo.id);
      }
      return draftWithPhoto(current, null);
    });
    setPhotoError(null);
  };
  const changeSelection = (rect: NormalizedRect) => {
    setDraft((current) => draftWithSelection(current, rect));
  };
  const clearTheSelection = () => {
    setDraft((current) => clearSelection(current));
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

      <div className={styles.previewColumn}>
        <SignAreaPicker
          messages={messages}
          photo={storedPhoto}
          photoError={photoError}
          selection={draft.selection}
          onSelectPhoto={selectPhoto}
          onRemovePhoto={removePhoto}
          onSelectionChange={changeSelection}
          onClearSelection={clearTheSelection}
        />

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
    </div>
  );
}
