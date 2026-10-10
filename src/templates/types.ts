/**
 * Types of the customer template catalogue. The catalogue is structured data: the
 * customisation UI and the live preview are generated from it, and the serialisable
 * customer draft references templates and colours by id. Ids are stable: the draft
 * serializer and the future Professional Studio transfer rely on them.
 */

export type TemplateId =
  | "neonScript"
  | "channelLetters"
  | "dimensionalMetal"
  | "minimalLetters"
  | "projectingBlade"
  | "awningBand"
  | "windowVinyl"
  | "lightboxPlaque"
  | "marqueeBulbs"
  | "totemPanel";

/** How a template composes the sign in the preview. Purely visual. */
export type LayoutId =
  | "neon"
  | "channel"
  | "dimensional"
  | "minimal"
  | "blade"
  | "band"
  | "vinyl"
  | "plaque"
  | "marquee"
  | "totem";

/** Colour slots a template customises. Unused slots keep their defaults. */
export type ColourRole = "face" | "glow" | "accent";

export type ColourId =
  | "cyan"
  | "azure"
  | "teal"
  | "emerald"
  | "amber"
  | "gold"
  | "coral"
  | "rose"
  | "violet"
  | "ice"
  | "warmWhite"
  | "graphite"
  | "silver"
  | "copper";

export type ColourOption = {
  id: ColourId;
  /** Hex value applied to the preview. Display names live in messages.colours.names. */
  value: string;
};

export type ColourSlot = {
  role: ColourRole;
  defaultId: ColourId;
  options: readonly ColourOption[];
};

export type SignTemplate = {
  id: TemplateId;
  layout: LayoutId;
  /** Customisable colour slots. Display name and hint live in messages.templates.items. */
  slots: readonly ColourSlot[];
};
