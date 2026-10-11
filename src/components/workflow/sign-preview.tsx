"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { computeFitScale, isArabicText, shouldWrapName } from "@/lib/text-fit";
import type { Messages } from "@/i18n/messages/en";
import type {
  ArrangementId,
  ColourRole,
  LayoutId,
  LetteringId,
  TemplateComposition,
  TemplateId,
} from "@/templates/types";

import { EmblemIcon } from "./emblems";
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
  /** The template's complete composition (frame, emblem, arrangement, lettering, scene). */
  composition: TemplateComposition;
  /** Effective lettering style (the customer's choice, or the template default). */
  lettering: LetteringId;
  /** Effective arrangement (a chosen design variant, or the template default). */
  arrangement?: ArrangementId;
  /** Compact rendering for template-gallery cards. */
  mini?: boolean;
};

/** First-guess scale from the name length, refined by measurement after mount. */
function initialFitScale(text: string): number {
  const length = text.trim().length;
  if (length <= 14) return 1;
  if (length <= 20) return 0.85;
  if (length <= 26) return 0.7;
  return 0.6;
}

/**
 * The live sign preview: a deterministic composition of the typed text in the
 * selected template and colours — the template's emblem, frame, arrangement,
 * lettering style and scene, all rendered from structured data. It is not
 * AI-generated imagery and not a fabrication model; the surrounding page states
 * that explicitly. Every update is instant. Long names are measured and scaled to
 * fit the board instead of clipping, and Arabic text never gets letter-spacing, so
 * cursive joining is never broken.
 */
export function SignPreview({
  messages,
  templateId,
  templateName,
  layout,
  colours,
  text,
  tagline,
  composition,
  lettering,
  arrangement,
  mini = false,
}: SignPreviewProps) {
  const copy = messages.create;
  const signText = text.trim() || copy.previewFallback;
  const signTagline = tagline.trim();
  const effectiveArrangement = arrangement ?? composition.arrangement;
  const cssVariables = {
    "--sign-face": colours.face,
    "--sign-glow": colours.glow,
    "--sign-accent": colours.accent,
  } as CSSProperties;

  // Text fitting: measure the rendered name against the board and scale down
  // instead of letting it clip or overflow the sign.
  const boardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fitScale, setFitScale] = useState(() => initialFitScale(signText));
  useEffect(() => {
    const board = boardRef.current;
    const label = textRef.current;
    if (!board || !label) return;
    const measure = () => {
      setFitScale(computeFitScale(label.scrollWidth, board.clientWidth));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    observer.observe(label);
    return () => observer.disconnect();
  }, [signText, signTagline, effectiveArrangement, lettering]);

  const textStyle = { "--sign-fit": fitScale } as CSSProperties;
  const script = isArabicText(signText) ? "ar" : undefined;
  const taglineScript = isArabicText(signTagline) ? "ar" : undefined;
  const wraps = shouldWrapName(signText);

  return (
    <figure className={styles.previewFrame} data-mini={mini ? "true" : undefined}>
      <figcaption className={styles.previewTitle}>{copy.previewLabel}</figcaption>
      <div
        className={styles.preview}
        data-template={templateId}
        data-layout={layout}
        data-background={composition.background}
        data-frame={composition.frame}
        data-arrangement={effectiveArrangement}
        data-lettering={lettering}
        // Mini previews inside gallery cards are presentational: the card's label
        // carries the template name, so they carry no group role of their own.
        role={mini ? undefined : "group"}
        aria-label={mini ? undefined : copy.previewLabel}
        style={cssVariables}
      >
        <p className={styles.previewTemplateName}>{templateName}</p>
        <div className={styles.signScene}>
          <div className={styles.signBoard} ref={boardRef}>
            <div className={styles.signFrame} aria-hidden="true" />
            <div className={styles.signComposition}>
              <span className={styles.signEmblem}>
                <EmblemIcon emblem={composition.emblem} />
              </span>
              <p
                className={styles.signText}
                ref={textRef}
                data-lettering={lettering}
                data-script={script}
                data-wrap={wraps ? "true" : undefined}
                style={textStyle}
              >
                {signText}
              </p>
              {signTagline !== "" && (
                <p className={styles.signTagline} data-script={taglineScript}>
                  {signTagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className={styles.previewCaption}>{copy.previewCaption}</p>
    </figure>
  );
}
