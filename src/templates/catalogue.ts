import { slot } from "./palette";
import type { SignTemplate, TemplateId } from "./types";

/**
 * The customer template catalogue. Every template is a complete sign composition —
 * emblem, frame, arrangement, lettering style and scene — customisable through named
 * colour slots, with a flat visual-mockup treatment (Milestone 4) and a full
 * composition layer for Normal Mode. Names, hints and categories are localised under
 * messages.templates; this module only defines structure and default colours.
 */
export const signTemplates: readonly SignTemplate[] = [
  {
    id: "neonScript",
    layout: "neon",
    category: "bold",
    slots: [
      slot("face", ["ice", "cyan", "rose", "warmWhite", "azure"]),
      slot("glow", ["cyan", "azure", "rose", "violet", "amber", "gold"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
    composition: {
      frame: "rounded",
      emblem: "flourish",
      arrangement: "stack",
      lettering: "script",
      background: "night",
    },
  },
  {
    id: "channelLetters",
    layout: "channel",
    category: "retail",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "cyan", "silver"]),
      slot("glow", ["azure", "cyan", "warmWhite", "gold", "emerald"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
    composition: {
      frame: "thin",
      emblem: "signPanel",
      arrangement: "stack",
      lettering: "display",
      background: "metal",
    },
  },
  {
    id: "dimensionalMetal",
    layout: "dimensional",
    category: "luxury",
    slots: [
      slot("face", ["silver", "graphite", "ice", "copper", "gold"]),
      slot("accent", ["cyan", "azure", "gold", "copper", "violet"]),
    ],
    mockup: { board: "panel", text: "gradient" },
    composition: {
      frame: "double",
      emblem: "gear",
      arrangement: "split",
      lettering: "modern",
      background: "metal",
    },
  },
  {
    id: "minimalLetters",
    layout: "minimal",
    category: "minimal",
    slots: [slot("face", ["ice", "warmWhite", "silver", "cyan", "rose"])],
    mockup: { board: "none", text: "flat" },
    composition: {
      frame: "none",
      emblem: "none",
      arrangement: "stack",
      lettering: "elegant",
      background: "wall",
    },
  },
  {
    id: "projectingBlade",
    layout: "blade",
    category: "retail",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "cyan", "coral"]),
      slot("accent", ["coral", "cyan", "gold", "emerald", "violet"]),
    ],
    mockup: { board: "panel", text: "flat" },
    composition: {
      frame: "blade",
      emblem: "star",
      arrangement: "inline",
      lettering: "display",
      background: "concrete",
    },
  },
  {
    id: "awningBand",
    layout: "band",
    category: "cafe",
    slots: [
      slot("face", ["ice", "warmWhite", "gold", "cyan"]),
      slot("accent", ["amber", "gold", "cyan", "coral", "emerald"]),
    ],
    mockup: { board: "panel", text: "band" },
    composition: {
      frame: "awning",
      emblem: "signPanel",
      arrangement: "band",
      lettering: "rounded",
      background: "wall",
    },
  },
  {
    id: "windowVinyl",
    layout: "vinyl",
    category: "retail",
    slots: [
      slot("face", ["ice", "cyan", "warmWhite", "rose"]),
      slot("accent", ["cyan", "azure", "gold", "rose"]),
    ],
    mockup: { board: "none", text: "flat" },
    composition: {
      frame: "thin",
      emblem: "none",
      arrangement: "columns",
      lettering: "condensed",
      background: "window",
    },
  },
  {
    id: "lightboxPlaque",
    layout: "plaque",
    category: "office",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "cyan"]),
      slot("glow", ["warmWhite", "cyan", "azure", "amber"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
    composition: {
      frame: "plaque",
      emblem: "bolt",
      arrangement: "stack",
      lettering: "modern",
      background: "night",
    },
  },
  {
    id: "marqueeBulbs",
    layout: "marquee",
    category: "bold",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "coral"]),
      slot("glow", ["amber", "warmWhite", "cyan", "gold"]),
    ],
    mockup: { board: "glowPanel", text: "glow" },
    composition: {
      frame: "marquee",
      emblem: "star",
      arrangement: "badge",
      lettering: "display",
      background: "dusk",
    },
  },
  {
    id: "totemPanel",
    layout: "totem",
    category: "industrial",
    slots: [
      slot("face", ["ice", "warmWhite", "cyan", "gold"]),
      slot("accent", ["azure", "cyan", "gold", "violet", "emerald"]),
    ],
    mockup: { board: "panel", text: "flat" },
    composition: {
      frame: "banner",
      emblem: "key",
      arrangement: "tower",
      lettering: "mono",
      background: "concrete",
    },
  },
  {
    id: "cafeMedina",
    layout: "band",
    category: "cafe",
    slots: [
      slot("face", ["warmWhite", "ice", "gold", "copper"]),
      slot("glow", ["amber", "gold", "warmWhite"]),
      slot("accent", ["copper", "amber", "coral"]),
    ],
    mockup: { board: "panel", text: "band" },
    composition: {
      frame: "awning",
      emblem: "coffeeCup",
      arrangement: "band",
      lettering: "classic",
      background: "dusk",
      variants: ["stack", "split"],
    },
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
