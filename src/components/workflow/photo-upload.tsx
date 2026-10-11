"use client";

import { useRef } from "react";

import type { Messages } from "@/i18n/messages/en";
import type { PhotoError } from "@/projects/photo-validation";
import type { PhotoMeta } from "@/templates/types";

import styles from "./photo-upload.module.css";

type PhotoUploadProps = {
  messages: Messages;
  /** Metadata of the currently held photo, or null when there is none. */
  photo: PhotoMeta | null;
  /** The latest validation error, shown in an alert region. */
  error: PhotoError | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

/**
 * The storefront photo control. The file input is visually hidden; a real button
 * opens it, so the control is keyboard-operable and honest. Validation happens in
 * the parent (photo-store intake); this component only displays its result.
 */
export function PhotoUpload({ messages, photo, error, onSelect, onRemove }: PhotoUploadProps) {
  const copy = messages.create.photo;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.root}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.fileInput}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onSelect(file);
          }
          // Allow picking the same file again after a removal.
          event.target.value = "";
        }}
      />

      {photo ? (
        <div className={styles.current}>
          <p className={styles.currentName}>
            <span className={styles.currentLabel}>{copy.currentLabel}:</span> {photo.name} ·{" "}
            {photo.width} × {photo.height}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              onClick={() => inputRef.current?.click()}
            >
              {copy.changeCta}
            </button>
            <button type="button" className={styles.button} onClick={onRemove}>
              {copy.removeCta}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.button} onClick={() => inputRef.current?.click()}>
          {copy.uploadCta}
        </button>
      )}

      {error ? (
        <p role="alert" className={styles.error}>
          {copy.errors[error]}
        </p>
      ) : null}
    </div>
  );
}
