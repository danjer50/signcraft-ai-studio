"use client";

import { useEffect, useRef, useState } from "react";

import type { Messages } from "@/i18n/messages/en";
import { canvasToPngBlob, MIN_RENDER_INTERVAL_MS, renderMockup } from "@/projects/mockup-render";
import type { StoredPhoto } from "@/projects/photo-store";
import type { ColourRole, LetteringId, NormalizedRect, SignTemplate } from "@/templates/types";

import styles from "./mockup-panel.module.css";

/**
 * The visual-mockup panel (Milestone 4, Approach A). Rendering is user-initiated
 * (a real button — never automatic), throttled to one render per second, and the
 * output is capped in the renderer. These are performance limits: nothing is ever
 * "used up", so browsing templates and editing text and colours keep working at
 * all times.
 *
 * The result is labelled honestly: a basic visual mockup — flat placement, no
 * perspective correction, no environmental lighting, no cast shadows, not
 * fabrication-ready. The photo and the mockup never leave the browser.
 */

type MockupPanelProps = {
  messages: Messages;
  /** The stored storefront photo; null until one is uploaded. */
  photo: StoredPhoto | null;
  /** The marked sign area; null until one is drawn. */
  selection: NormalizedRect | null;
  /** The selected template (layout + mockup style). */
  template: SignTemplate;
  /** The sign's business name. */
  text: string;
  /** The sign's tagline. */
  tagline: string;
  /** Resolved hex values per colour role. */
  colours: Record<ColourRole, string>;
  /** The customer's lettering (font) style choice. */
  lettering: LetteringId;
};

type RenderState =
  | { status: "idle" }
  | { status: "rendering" }
  | { status: "done"; objectUrl: string }
  | { status: "error"; kind: "unsupported" | "decode" | "render" | "encode" };

export function MockupPanel({
  messages,
  photo,
  selection,
  template,
  text,
  tagline,
  colours,
  lettering,
}: MockupPanelProps) {
  const copy = messages.create.mockup;
  const [state, setState] = useState<RenderState>({ status: "idle" });
  const lastRenderAt = useRef(0);
  const blobRef = useRef<Blob | null>(null);
  // The ref always holds the CURRENT result URL, so the unmount cleanup can release
  // it regardless of when the component re-rendered (the previous implementation
  // captured the initial idle state and leaked the last blob URL on unmount).
  const objectUrlRef = useRef<string | null>(null);

  const ready = photo !== null && selection !== null;
  const disabledReason = !photo
    ? copy.disabledNoPhoto
    : !selection
      ? copy.disabledNoSelection
      : null;

  // The result object URL is session memory: release it on unmount.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      blobRef.current = null;
    };
  }, []);

  const generate = async () => {
    if (!ready || state.status === "rendering") {
      return;
    }
    // Performance throttle: at most one render per interval, so low-end phones stay
    // responsive. This never blocks any other feature.
    const now = Date.now();
    if (now - lastRenderAt.current < MIN_RENDER_INTERVAL_MS) {
      return;
    }
    lastRenderAt.current = now;

    setState({ status: "rendering" });

    const rendered = await renderMockup({
      photo: photo as StoredPhoto,
      selection: selection as NormalizedRect,
      text: text.trim() === "" ? messages.create.previewFallback : text,
      tagline,
      template,
      colours,
      lettering,
    });
    if (!rendered.ok) {
      setState({ status: "error", kind: rendered.error });
      return;
    }
    try {
      const blob = await canvasToPngBlob(rendered.canvas);
      const objectUrl = URL.createObjectURL(blob);
      // Revoke the previous URL only AFTER the new one exists: no gap in the
      // displayed result and no leak when the panel unmounts later.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = objectUrl;
      blobRef.current = blob;
      setState({ status: "done", objectUrl });
    } catch {
      setState({ status: "error", kind: "encode" });
    }
  };

  const download = () => {
    if (state.status !== "done" || !blobRef.current) {
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = state.objectUrl;
    anchor.download = "signcraft-mockup.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const busy = state.status === "rendering";

  return (
    <section className={styles.panel} aria-labelledby="mockup-title" data-mockup-panel="">
      <h2 className={styles.title} id="mockup-title">
        {copy.title}
      </h2>
      <p className={styles.lead}>{copy.lead}</p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          disabled={!ready || busy}
          onClick={generate}
          aria-describedby={disabledReason ? "mockup-disabled-reason" : undefined}
        >
          {state.status === "done" ? copy.regenerateCta : copy.generateCta}
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={state.status !== "done"}
          onClick={download}
        >
          {copy.downloadCta}
        </button>
      </div>

      {disabledReason ? (
        <p className={styles.hint} id="mockup-disabled-reason">
          {disabledReason}
        </p>
      ) : null}

      <p className={styles.status} role="status" aria-live="polite">
        {busy ? copy.rendering : null}
        {state.status === "error"
          ? state.kind === "unsupported"
            ? copy.unsupported
            : copy.error
          : null}
      </p>

      {state.status === "done" ? (
        <figure className={styles.result}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the mockup is a local blob URL */}
          <img className={styles.image} src={state.objectUrl} alt={copy.mockupAlt} />
          <figcaption className={styles.note}>{copy.honestyNote}</figcaption>
        </figure>
      ) : null}
    </section>
  );
}
