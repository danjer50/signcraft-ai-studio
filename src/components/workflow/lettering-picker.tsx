"use client";

import { useId } from "react";

import type { Messages } from "@/i18n/messages/en";
import { letteringIds, type LetteringId } from "@/templates/types";

import previewStyles from "./sign-preview.module.css";
import styles from "./lettering-picker.module.css";

type LetteringPickerProps = {
  messages: Messages;
  value: LetteringId;
  onChange: (lettering: LetteringId) => void;
};

/**
 * The lettering (font) picker for Normal Mode. Each option shows a live sample —
 * Latin and Arabic — rendered with that lettering style, so the customer sees the
 * difference before choosing. The choice updates the preview instantly through the
 * parent's state and never resets colours or the selected template.
 */
export function LetteringPicker({ messages, value, onChange }: LetteringPickerProps) {
  const groupName = useId();
  const copy = messages.templates.lettering;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>{copy.legend}</legend>
      <p className={styles.hint}>{copy.hint}</p>
      <div className={styles.options}>
        {letteringIds.map((letteringId) => (
          <label key={letteringId} className={styles.option} data-selected={value === letteringId}>
            <input
              type="radio"
              name={groupName}
              value={letteringId}
              checked={value === letteringId}
              onChange={() => onChange(letteringId)}
              className={styles.radio}
            />
            <span className={previewStyles.preview} data-lettering={letteringId}>
              <span
                className={previewStyles.signText}
                data-lettering={letteringId}
                style={{ fontSize: "1.05rem" }}
              >
                {copy.sample}
              </span>
            </span>
            <span className={styles.optionName}>{copy.names[letteringId]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
