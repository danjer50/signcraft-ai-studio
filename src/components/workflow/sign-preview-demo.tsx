"use client";

import { useId, useState } from "react";

import type { Messages } from "@/i18n/messages/en";

import styles from "./sign-preview-demo.module.css";

const styleKeys = ["neon", "channel", "dimensional", "minimal"] as const;
type StyleKey = (typeof styleKeys)[number];

const DEFAULT_TEXT = "Studio";

/**
 * A working local demonstration of the first customer steps: describing a sign
 * (text) and choosing a visual direction. The preview is a deterministic style
 * composition of the typed text — not an AI-generated design and not a fabrication
 * model; the panel below says so explicitly. It has no submit action: requesting
 * changes and continuing are planned (step 4 of the workflow).
 */
export function SignPreviewDemo({ messages }: { messages: Messages }) {
  const copy = messages.create;
  const textId = useId();
  const taglineId = useId();
  const styleName = useId();
  const previewTitleId = useId();
  const previewCaptionId = useId();

  const [text, setText] = useState(DEFAULT_TEXT);
  const [tagline, setTagline] = useState("");
  const [style, setStyle] = useState<StyleKey>("channel");

  const signText = text.trim() || copy.previewFallback;

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
            value={text}
            maxLength={32}
            placeholder={copy.textPlaceholder}
            onChange={(event) => setText(event.target.value)}
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
            value={tagline}
            maxLength={48}
            placeholder={copy.taglinePlaceholder}
            onChange={(event) => setTagline(event.target.value)}
          />
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>{copy.styleLegend}</legend>
          <div className={styles.styleOptions}>
            {styleKeys.map((key) => (
              <label key={key} className={styles.styleOption} data-selected={style === key}>
                <input
                  type="radio"
                  name={styleName}
                  value={key}
                  checked={style === key}
                  onChange={() => setStyle(key)}
                  className={styles.radio}
                />
                <span className={styles.styleText}>
                  <span className={styles.styleLabel}>{copy.styles[key].label}</span>
                  <span className={styles.styleHint}>{copy.styles[key].hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <figure className={styles.previewFrame}>
        <figcaption id={previewTitleId} className={styles.previewTitle}>
          {copy.previewLabel}
        </figcaption>
        <div
          className={styles.preview}
          data-style={style}
          role="group"
          aria-labelledby={previewTitleId}
          aria-describedby={previewCaptionId}
        >
          <div className={styles.signScene}>
            <p className={styles.signText}>{signText}</p>
            {tagline.trim() !== "" && <p className={styles.signTagline}>{tagline.trim()}</p>}
          </div>
        </div>
        <p id={previewCaptionId} className={styles.previewCaption}>
          {copy.previewCaption}
        </p>
      </figure>
    </div>
  );
}
