import { defaultTemplateId, getTemplate, templateIds } from "./catalogue";
import { colourPalette } from "./palette";
import type { ColourId, ColourRole, TemplateId } from "./types";

/**
 * The serialisable customer draft: everything a visitor has customised, with stable
 * ids only. This is the seam for the future transfer into the Professional Studio.
 * It is serialised as plain JSON with a version field; parseDraft refuses anything
 * malformed instead of guessing.
 */

export const DRAFT_VERSION = 1 as const;

export const MAX_TEXT_LENGTH = 64;
export const MAX_TAGLINE_LENGTH = 96;

export type CustomerDraft = {
  version: typeof DRAFT_VERSION;
  templateId: TemplateId;
  text: string;
  tagline: string;
  colours: Record<ColourRole, ColourId>;
};

const colourIds = new Set<string>(Object.keys(colourPalette));

function isColourId(value: unknown): value is ColourId {
  return typeof value === "string" && colourIds.has(value);
}

function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (templateIds as readonly string[]).includes(value);
}

function clampText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
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
  };
}

/**
 * Switching template keeps the business name and tagline and resets colours to the
 * new template's defaults.
 */
export function draftWithTemplate(draft: CustomerDraft, templateId: TemplateId): CustomerDraft {
  return { ...draft, templateId, colours: defaultColours(templateId) };
}

export function serializeDraft(draft: CustomerDraft): string {
  return JSON.stringify(draft);
}

/**
 * Parses a draft produced by serializeDraft. Returns null for anything malformed:
 * wrong version, unknown template or colour ids, or non-object payloads. Missing
 * colour entries fall back to the template defaults; text fields are clamped.
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
  if (record.version !== DRAFT_VERSION || !isTemplateId(record.templateId)) {
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

  return {
    version: DRAFT_VERSION,
    templateId: record.templateId,
    text: clampText(record.text, MAX_TEXT_LENGTH),
    tagline: clampText(record.tagline, MAX_TAGLINE_LENGTH),
    colours,
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
