"use client";

import { useEffect, useId, useRef } from "react";

import type { Messages } from "@/i18n/messages/en";
import type { StoredPhoto } from "@/projects/photo-store";
import type { PhotoError } from "@/projects/photo-validation";
import type { NormalizedRect } from "@/templates/types";

import { PhotoUpload } from "./photo-upload";
import styles from "./sign-area-picker.module.css";

type SignAreaPickerProps = {
  messages: Messages;
  /** The held storefront photo, or null before upload. */
  photo: StoredPhoto | null;
  photoError: PhotoError | null;
  selection: NormalizedRect | null;
  onSelectPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onSelectionChange: (rect: NormalizedRect) => void;
  onClearSelection: () => void;
};

/** A point on the photo, as fractions of its natural size (0..1). */
type Point = { x: number; y: number };

const HANDLE_IDS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type HandleId = (typeof HANDLE_IDS)[number];

type DragState = {
  mode: "draw" | "move" | "resize";
  /** Pointer position (fractions) where the drag started. */
  anchor: Point;
  /** The selection as it was when the drag started. */
  startRect: NormalizedRect;
  handle: HandleId | null;
};

/** The default area offered to keyboard and mouse users alike: centred, 60 % × 40 %. */
const DEFAULT_RECT: NormalizedRect = { x: 0.2, y: 0.3, width: 0.6, height: 0.4 };

const KEYBOARD_STEP = 0.01;

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/** Rounds a normalised rectangle to 6 decimals, free of floating-point dust. */
function roundRect(rect: NormalizedRect): NormalizedRect {
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  return {
    x: round(rect.x),
    y: round(rect.y),
    width: round(rect.width),
    height: round(rect.height),
  };
}

function pointInside(point: Point, rect: NormalizedRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/** The rectangle spanned by a fixed anchor and the current pointer, per handle. */
function resizedRect(handle: HandleId, start: NormalizedRect, point: Point): NormalizedRect {
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  const left = handle === "ne" || handle === "e" || handle === "se" ? start.x : point.x;
  const top = handle === "sw" || handle === "s" || handle === "se" ? start.y : point.y;
  const rightEdge = handle === "nw" || handle === "w" || handle === "sw" ? right : point.x;
  const bottomEdge = handle === "nw" || handle === "n" || handle === "ne" ? bottom : point.y;
  return {
    x: Math.min(left, rightEdge),
    y: Math.min(top, bottomEdge),
    width: Math.abs(rightEdge - left),
    height: Math.abs(bottomEdge - top),
  };
}

function handlePosition(handle: HandleId, rect: NormalizedRect): Point {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const midX = rect.x + rect.width / 2;
  const midY = rect.y + rect.height / 2;
  switch (handle) {
    case "nw":
      return { x: rect.x, y: rect.y };
    case "n":
      return { x: midX, y: rect.y };
    case "ne":
      return { x: right, y: rect.y };
    case "e":
      return { x: right, y: midY };
    case "se":
      return { x: right, y: bottom };
    case "s":
      return { x: midX, y: bottom };
    case "sw":
      return { x: rect.x, y: bottom };
    case "w":
      return { x: rect.x, y: midY };
  }
}

function formatTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => params[key] ?? match);
}

/**
 * The storefront photo panel: upload control, the photo with an adjustable
 * rectangular sign-area selection, and the honesty notes. The selection is drawn,
 * moved and resized with pointer events (mouse and touch) and adjusted with the
 * keyboard on the stage's single tab stop. Coordinates are normalised fractions of
 * the photo, so they are resolution-independent. The placement shown is schematic:
 * nothing is composited onto the photo.
 */
export function SignAreaPicker({
  messages,
  photo,
  photoError,
  selection,
  onSelectPhoto,
  onRemovePhoto,
  onSelectionChange,
  onClearSelection,
}: SignAreaPickerProps) {
  const copy = messages.create;
  const titleId = useId();
  const hintId = useId();

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const pointFromEvent = (event: { clientX: number; clientY: number }): Point => {
    const stage = stageRef.current;
    if (!stage) {
      return { x: 0, y: 0 };
    }
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    };
  };

  const endDrag = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    dragRef.current = null;
  };

  // Remove the window listeners when the component unmounts mid-drag.
  useEffect(() => endDrag, []);

  const beginDrag = (drag: DragState) => {
    endDrag();
    dragRef.current = drag;
    const onMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) {
        return;
      }
      const point = pointFromEvent(event);
      let next: NormalizedRect;
      if (current.mode === "draw") {
        next = {
          x: Math.min(current.anchor.x, point.x),
          y: Math.min(current.anchor.y, point.y),
          width: Math.abs(point.x - current.anchor.x),
          height: Math.abs(point.y - current.anchor.y),
        };
      } else if (current.mode === "move") {
        next = {
          x: current.startRect.x + (point.x - current.anchor.x),
          y: current.startRect.y + (point.y - current.anchor.y),
          width: current.startRect.width,
          height: current.startRect.height,
        };
      } else {
        next = resizedRect(current.handle ?? "se", current.startRect, point);
      }
      onSelectionChange(roundRect(next));
    };
    const onUp = () => {
      // A press outside the selection already cleared it when the draw started;
      // a press inside produced a move that either changed nothing (a click) or
      // the final rectangle (a drag). Nothing more to do here.
      endDrag();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    cleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  };

  const handleStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!photo) {
      return;
    }
    const point = pointFromEvent(event);
    if (selection && pointInside(point, selection)) {
      beginDrag({ mode: "move", anchor: point, startRect: selection, handle: null });
    } else {
      // Starting a new draw replaces the current selection immediately.
      onClearSelection();
      beginDrag({
        mode: "draw",
        anchor: point,
        startRect: { x: point.x, y: point.y, width: 0, height: 0 },
        handle: null,
      });
    }
  };

  const handleHandlePointerDown =
    (handle: HandleId) => (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (!selection) {
        return;
      }
      beginDrag({
        mode: "resize",
        anchor: pointFromEvent(event),
        startRect: selection,
        handle,
      });
    };

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selection) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelectionChange(DEFAULT_RECT);
      }
      return;
    }
    const step = KEYBOARD_STEP;
    let next: NormalizedRect | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = event.shiftKey
          ? { ...selection, width: selection.width - step }
          : { ...selection, x: selection.x - step };
        break;
      case "ArrowRight":
        next = event.shiftKey
          ? { ...selection, width: selection.width + step }
          : { ...selection, x: selection.x + step };
        break;
      case "ArrowUp":
        next = event.shiftKey
          ? { ...selection, height: selection.height - step }
          : { ...selection, y: selection.y - step };
        break;
      case "ArrowDown":
        next = event.shiftKey
          ? { ...selection, height: selection.height + step }
          : { ...selection, y: selection.y + step };
        break;
      case "Delete":
      case "Backspace":
        event.preventDefault();
        onClearSelection();
        return;
      default:
        return;
    }
    event.preventDefault();
    onSelectionChange(roundRect(next));
  };

  const groupLabel = selection
    ? formatTemplate(copy.selection.groupLabelWithSize, {
        width: String(Math.round(selection.width * 100)),
        height: String(Math.round(selection.height * 100)),
      })
    : copy.selection.groupLabel;

  const round4 = (value: number) => Math.round(value * 10000) / 10000;

  return (
    <section aria-labelledby={titleId} className={styles.panel} data-photo-panel>
      <h3 id={titleId} className={styles.title}>
        {copy.photo.title}
      </h3>
      <p className={styles.lead}>{copy.photo.lead}</p>

      <PhotoUpload
        messages={messages}
        photo={photo?.meta ?? null}
        error={photoError}
        onSelect={onSelectPhoto}
        onRemove={onRemovePhoto}
      />

      {photo ? (
        <>
          <div
            ref={stageRef}
            className={styles.stage}
            data-photo-stage
            data-photo-id={photo.meta.id}
            role="group"
            tabIndex={0}
            aria-label={groupLabel}
            aria-describedby={hintId}
            onPointerDown={handleStagePointerDown}
            onKeyDown={handleStageKeyDown}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a blob: object URL cannot use next/image */}
            <img
              src={photo.objectUrl}
              alt={copy.photo.photoAlt}
              draggable={false}
              className={styles.photo}
            />
            {selection ? (
              <div className={styles.overlay}>
                <div
                  className={styles.selectionRect}
                  data-selection
                  data-x={round4(selection.x)}
                  data-y={round4(selection.y)}
                  data-width={round4(selection.width)}
                  data-height={round4(selection.height)}
                  style={{
                    insetInlineStart: `${selection.x * 100}%`,
                    insetBlockStart: `${selection.y * 100}%`,
                    width: `${selection.width * 100}%`,
                    height: `${selection.height * 100}%`,
                  }}
                >
                  {HANDLE_IDS.map((handle) => {
                    const position = handlePosition(handle, selection);
                    return (
                      <div
                        key={handle}
                        className={styles.handle}
                        data-handle={handle}
                        aria-hidden="true"
                        onPointerDown={handleHandlePointerDown(handle)}
                        style={{
                          insetInlineStart: `calc(${position.x * 100}% - 0.625rem)`,
                          insetBlockStart: `calc(${position.y * 100}% - 0.625rem)`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <p id={hintId} className={styles.hint}>
            {selection ? copy.selection.adjustHint : copy.selection.hint}
          </p>
          <p className={styles.hint}>{copy.selection.keyboardHint}</p>

          {selection ? (
            <p className={styles.schematicNote}>{copy.selection.schematicNote}</p>
          ) : (
            <p className={styles.hint}>{copy.selection.emptyHint}</p>
          )}

          <div className={styles.actions}>
            {selection ? (
              <>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    onClearSelection();
                    stageRef.current?.focus();
                  }}
                >
                  {copy.selection.redrawCta}
                </button>
                <button type="button" className={styles.button} onClick={onClearSelection}>
                  {copy.selection.clearCta}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.button}
                onClick={() => onSelectionChange(DEFAULT_RECT)}
              >
                {copy.selection.defaultCta}
              </button>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
