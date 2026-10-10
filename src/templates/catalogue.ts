import { slot } from "./palette";
import type { SignTemplate, TemplateId } from "./types";

/**
 * The customer template catalogue. Ten sign styles, each customisable through named
 * colour slots and each carrying a flat visual-mockup treatment (Milestone 4).
 * Names and hints are localised under messages.templates.items[id]; this module
 * only defines structure and default colours.
 */
export const signTemplates: readonly SignTemplate[] = [
  {
    id: "neonScript",
    layout: "neon",
    slots: [
      slot("face", ["ice", "cyan", "rose", "warmWhite", "azure"]),
      slot("glow", ["cyan", "azure", "rose", "violet", "amber", "gold"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
  },
  {
    id: "channelLetters",
    layout: "channel",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "cyan", "silver"]),
      slot("glow", ["azure", "cyan", "warmWhite", "gold", "emerald"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
  },
  {
    id: "dimensionalMetal",
    layout: "dimensional",
    slots: [
      slot("face", ["silver", "graphite", "ice", "copper", "gold"]),
      slot("accent", ["cyan", "azure", "gold", "copper", "violet"]),
    ],
    mockup: { board: "panel", text: "gradient" },
  },
  {
    id: "minimalLetters",
    layout: "minimal",
    slots: [slot("face", ["ice", "warmWhite", "silver", "cyan", "rose"])],
    mockup: { board: "none", text: "flat" },
  },
  {
    id: "projectingBlade",
    layout: "blade",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "cyan", "coral"]),
      slot("accent", ["coral", "cyan", "gold", "emerald", "violet"]),
    ],
    mockup: { board: "panel", text: "flat" },
  },
  {
    id: "awningBand",
    layout: "band",
    slots: [
      slot("face", ["ice", "warmWhite", "gold", "cyan"]),
      slot("accent", ["amber", "gold", "cyan", "coral", "emerald"]),
    ],
    mockup: { board: "panel", text: "band" },
  },
  {
    id: "windowVinyl",
    layout: "vinyl",
    slots: [
      slot("face", ["ice", "cyan", "warmWhite", "rose"]),
      slot("accent", ["cyan", "azure", "gold", "rose"]),
    ],
    mockup: { board: "none", text: "flat" },
  },
  {
    id: "lightboxPlaque",
    layout: "plaque",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "cyan"]),
      slot("glow", ["warmWhite", "cyan", "azure", "amber"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
  },
  {
    id: "marqueeBulbs",
    layout: "marquee",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "coral"]),
      slot("glow", ["amber", "warmWhite", "cyan", "gold"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
  },
  {
    id: "totemPanel",
    layout: "totem",
    slots: [
      slot("face", ["ice", "warmWhite", "cyan", "gold"]),
      slot("accent", ["azure", "cyan", "gold", "violet", "emerald"]),
    ],
    mockup: { board: "panel", text: "flat" },
  },
];

export const templateIds: readonly TemplateId[] = signTemplates.map((template) => template.id);

export const defaultTemplateId: TemplateId = "channelLetters";

export function getTemplate(id: TemplateId): SignTemplate {
  const template = signTemplates.find((candidate) => candidate.id === id);
  if (!template) {
    throw new Error(`Unknown template id: ${id}`);
  }
  return template;
}
