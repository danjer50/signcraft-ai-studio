"use client";

import { useEffect, useId, useState } from "react";

import type { Messages } from "@/i18n/messages/en";
import { loadDraft, saveDraft } from "@/projects/draft-store";
import { getPhoto, intakePhoto, releaseAllPhotos, releasePhoto } from "@/projects/photo-store";
import type { PhotoError } from "@/projects/photo-validation";
import { getTemplate } from "@/templates/catalogue";
import {
  clearSelection,
  defaultDraft,
  draftWithLettering,
  draftWithPhoto,
  draftWithSelection,
  draftWithTemplate,
  resolveColourValues,
  MAX_TAGLINE_LENGTH,
  MAX_TEXT_LENGTH,
  type CustomerDraft,
} from "@/templates/draft";
import type {
  ArrangementId,
  ColourId,
  ColourRole,
  NormalizedRect,
  TemplateId,
} from "@/templates/types";

import { ColourPicker } from "./colour-picker";
import { LetteringPicker } from "./lettering-picker";
import { MockupPanel } from "./mockup-panel";
import { SignAreaPicker } from "./sign-area-picker";
import { SignPreview } from "./sign-preview";
import { TemplateGallery } from "./template-gallery";
import styles from "./sign-preview-demo.module.css";

/**
 * Normal Mode: a working, fully local, AI-free demonstration of the customer
 * workflow. The customer browses the template gallery of complete sign designs,
 * picks one, types a business name and optional tagline, and customises colours,
 * lettering style and (where the design offers them) composition variants — the
 * preview updates instantly on every change. The chosen design keeps its emblem,
 * frame and layout while the text changes. The draft is persisted on this device,
 * so a reload keeps the work.
 *
 * The storefront photo and the flat visual mockup remain an OPTIONAL extra step:
 * they never block the sign-design workflow. Rendering is deterministic — no AI
 * service is involved anywhere in this flow.
 */
export function SignPreviewDemo({ messages }: { messages: Messages }) {
  const copy = messages.create;
  const textId = useId();
  const taglineId = useId();

  const [draft, setDraft] = useState<CustomerDraft>(() => loadDraft() ?? defaultDraft());
  const [arrangement, setArrangement] = useState<ArrangementId | null>(null);
  const [photoError, setPhotoError] = useState<PhotoError | null>(null);
  const template = getTemplate(draft.templateId);
  const colours = resolveColourValues(draft);
  const storedPhoto = draft.photo ? getPhoto(draft.photo.id) : null;

  // Persist the draft on this device after every change (best-effort).
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  // The photo store is session memory: release it when the demo unmounts.
  useEffect(() => releaseAllPhotos, []);

  const setTemplate = (templateId: TemplateId) => {
    setArrangement(null);
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

  const variants = template.composition.variants ?? [];
  const effectiveArrangement = arrangement ?? template.composition.arrangement;

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

        <TemplateGallery
          messages={messages}
          value={draft.templateId}
          onChange={setTemplate}
          text={draft.text}
          tagline={draft.tagline}
        />

        <ColourPicker
          messages={messages}
          template={template}
          value={draft.colours}
          onChange={setColour}
        />

        <LetteringPicker
          messages={messages}
          value={draft.lettering}
          onChange={(lettering) => setDraft((current) => draftWithLettering(current, lettering))}
        />

        {variants.length > 0 && (
          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>{messages.templates.variants.legend}</legend>
            <p className={styles.hint}>{messages.templates.variants.hint}</p>
            <div className={styles.variantOptions}>
              {variants.map((variant) => (
                <label
                  key={variant}
                  className={styles.variantOption}
                  data-selected={effectiveArrangement === variant}
                >
                  <input
                    type="radio"
                    name={`${textId}-variant`}
                    value={variant}
                    checked={effectiveArrangement === variant}
                    onChange={() => setArrangement(variant)}
                    className={styles.radio}
                  />
                  <span>{messages.templates.arrangements[variant]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
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
          composition={template.composition}
          lettering={draft.lettering}
          arrangement={effectiveArrangement}
        />

        <MockupPanel
          messages={messages}
          photo={storedPhoto}
          selection={draft.selection}
          template={template}
          text={draft.text}
          tagline={draft.tagline}
          colours={colours}
          lettering={draft.lettering}
        />
      </div>
    </div>
  );
}
