import { defaultTemplateId, getTemplate, templateIds } from "./catalogue";
import { colourPalette } from "./palette";
import type {
  ColourId,
  ColourRole,
  LetteringId,
  NormalizedRect,
  PhotoMeta,
  TemplateId,
} from "./types";

/**
 * The serialisable customer draft: everything a visitor has customised, with stable
 * ids only. This is the seam for the future transfer into the Professional Studio.
 * It is serialised as plain JSON with a version field; parseDraft refuses anything
 * malformed instead of guessing.
 *
 * Version 2 adds the storefront photo metadata and the normalised sign-area
 * selection (Milestone 3). Version 3 adds the lettering (font) style choice.
 * Older drafts are still accepted and migrated.
 */

export const DRAFT_VERSION = 3 as const;

export const MAX_TEXT_LENGTH = 64;
export const MAX_TAGLINE_LENGTH = 96;

/** Smallest selectable area, as a fraction of the photo: 2 % per side. */
export const MIN_SELECTION = 0.02;

export type CustomerDraft = {
  version: typeof DRAFT_VERSION;
  templateId: TemplateId;
  text: string;
  tagline: string;
  colours: Record<ColourRole, ColourId>;
  /** The customer's lettering (font) style choice for the sign text. */
  lettering: LetteringId;
  /** Storefront photo metadata; the pixels live in the photo store under photo.id. */
  photo: PhotoMeta | null;
  /** Sign-area selection, normalised to the photo's natural size. */
  selection: NormalizedRect | null;
};

const colourIds = new Set<string>(Object.keys(colourPalette));

function isColourId(value: unknown): value is ColourId {
  return typeof value === "string" && colourIds.has(value);
}

function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (templateIds as readonly string[]).includes(value);
}

const letteringIds = new Set<string>([
  "modern",
  "classic",
  "mono",
  "rounded",
  "condensed",
  "script",
  "kufi",
  "naskh",
  "display",
  "elegant",
]);

function isLetteringId(value: unknown): value is LetteringId {
  return typeof value === "string" && letteringIds.has(value);
}

/** The lettering style a template presents by default. */
export function defaultLettering(templateId: TemplateId): LetteringId {
  return getTemplate(templateId).composition.lettering;
}

function clampText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Clamps a normalised rectangle into the photo: inside the 0..1 bounds, at least
 * MIN_SELECTION per side. Non-finite input is rejected by the caller (parseDraft);
 * the UI only ever produces finite coordinates from pointer positions.
 */
export function clampRect(rect: NormalizedRect): NormalizedRect {
  // Rounded to 6 decimals: well below a pixel at any realistic photo size, and it
  // keeps the arithmetic free of floating-point dust (1 - 0.98 is not 0.02).
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  const x = round(clamp01(Math.min(rect.x, 1 - MIN_SELECTION)));
  const y = round(clamp01(Math.min(rect.y, 1 - MIN_SELECTION)));
  const width = round(Math.min(Math.max(rect.width, MIN_SELECTION), 1 - x));
  const height = round(Math.min(Math.max(rect.height, MIN_SELECTION), 1 - y));
  return { x, y, width, height };
}

function parsePhotoMeta(value: unknown): PhotoMeta | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    record.id === "" ||
    typeof record.name !== "string" ||
    typeof record.type !== "string" ||
    !/^image\/(jpeg|png|webp)$/.test(record.type) ||
    !Number.isInteger(record.sizeBytes) ||
    (record.sizeBytes as number) < 0 ||
    !Number.isInteger(record.width) ||
    !Number.isInteger(record.height) ||
    (record.width as number) <= 0 ||
    (record.height as number) <= 0 ||
    typeof record.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(record.sha256)
  ) {
    return null;
  }
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    sizeBytes: record.sizeBytes as number,
    width: record.width as number,
    height: record.height as number,
    sha256: record.sha256,
  };
}

function parseSelection(value: unknown): NormalizedRect | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const parts = [record.x, record.y, record.width, record.height];
  if (parts.some((part) => typeof part !== "number" || !Number.isFinite(part))) {
    return null;
  }
  return clampRect({
    x: record.x as number,
    y: record.y as number,
    width: record.width as number,
    height: record.height as number,
  });
}

/** Default colours for a template: each slot's declared default. */
export function defaultColours(templateId: TemplateId): Record<ColourRole, ColourId> {
  const ids: Record<ColourRole, ColourId> = { face: "ice", glow: "cyan", accent: "azure" };
  for (const slot of getTemplate(templateId).slots) {
    ids[slot.role] = slot.defaultId;
  }
  return ids;
}

/** A fresh draft for the default template. */
export function defaultDraft(): CustomerDraft {
  return {
    version: DRAFT_VERSION,
    templateId: defaultTemplateId,
    text: "",
    tagline: "",
    colours: defaultColours(defaultTemplateId),
    lettering: defaultLettering(defaultTemplateId),
    photo: null,
    selection: null,
  };
}

/**
 * Switching template keeps the business name and tagline and resets colours and
 * lettering to the new template's defaults.
 */
export function draftWithTemplate(draft: CustomerDraft, templateId: TemplateId): CustomerDraft {
  return {
    ...draft,
    templateId,
    colours: defaultColours(templateId),
    lettering: defaultLettering(templateId),
  };
}

/** Sets the customer's lettering (font) style choice. */
export function draftWithLettering(draft: CustomerDraft, lettering: LetteringId): CustomerDraft {
  return { ...draft, lettering };
}

/**
 * Setting the photo replaces it entirely; the previous selection is dropped because
 * it referred to the previous photo.
 */
export function draftWithPhoto(draft: CustomerDraft, photo: PhotoMeta | null): CustomerDraft {
  return { ...draft, photo, selection: null };
}

/** Sets the sign-area selection. Without a photo a selection is meaningless. */
export function draftWithSelection(draft: CustomerDraft, selection: NormalizedRect): CustomerDraft {
  if (!draft.photo) {
    return draft;
  }
  return { ...draft, selection: clampRect(selection) };
}

export function clearSelection(draft: CustomerDraft): CustomerDraft {
  return { ...draft, selection: null };
}

export function serializeDraft(draft: CustomerDraft): string {
  return JSON.stringify(draft);
}

/**
 * Parses a draft produced by serializeDraft. Accepts version 1 (migrated: photo and
 * selection become null), version 2 (migrated: lettering falls back to the template
 * default) and version 3. Returns null for anything malformed: wrong version,
 * unknown template, colour or lettering ids, invalid photo metadata or selection,
 * or non-object payloads. Missing colour entries fall back to the template defaults;
 * text fields are clamped.
 */
export function parseDraft(raw: string): CustomerDraft | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (record.version !== 1 && record.version !== 2 && record.version !== DRAFT_VERSION) {
    return null;
  }
  if (!isTemplateId(record.templateId)) {
    return null;
  }
  const template = getTemplate(record.templateId);
  const defaults = defaultColours(record.templateId);

  const colours: Record<ColourRole, ColourId> = { ...defaults };
  if (typeof record.colours === "object" && record.colours !== null) {
    const raw = record.colours as Record<string, unknown>;
    for (const slot of template.slots) {
      const value = raw[slot.role];
      if (value === undefined) {
        continue;
      }
      if (!isColourId(value)) {
        return null;
      }
      colours[slot.role] = value;
    }
  }

  const photo = parsePhotoMeta(record.photo ?? null);
  if (record.photo !== undefined && record.photo !== null && photo === null) {
    return null;
  }

  const selection = parseSelection(record.selection ?? null);
  if (record.selection !== undefined && record.selection !== null && selection === null) {
    return null;
  }

  // Version 2 and older drafts predate the lettering choice: fall back to the
  // template's default style rather than rejecting the customer's saved design.
  const lettering = isLetteringId(record.lettering)
    ? record.lettering
    : defaultLettering(record.templateId);

  return {
    version: DRAFT_VERSION,
    templateId: record.templateId,
    text: clampText(record.text, MAX_TEXT_LENGTH),
    tagline: clampText(record.tagline, MAX_TAGLINE_LENGTH),
    colours,
    lettering,
    photo,
    selection,
  };
}

/** Resolved hex values for the preview, for every role. */
export function resolveColourValues(draft: CustomerDraft): Record<ColourRole, string> {
  return {
    face: colourPalette[draft.colours.face],
    glow: colourPalette[draft.colours.glow],
    accent: colourPalette[draft.colours.accent],
  };
}
