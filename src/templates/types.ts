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

/**
 * How a template paints the sign in the client-side visual mockup. The mockup is
 * a flat, axis-aligned placement: the board sits behind the letters and the text
 * treatment gives the template its character, with no perspective, environmental
 * lighting or cast shadows.
 */
export type MockupBoard = "none" | "panel" | "glowPanel";

export type MockupText = "flat" | "glow" | "gradient" | "band";

export type MockupStyle = {
  /** The board drawn behind the letters, fitted into the marked area. */
  board: MockupBoard;
  /** How the letters themselves are painted. */
  text: MockupText;
};

export type SignTemplate = {
  id: TemplateId;
  layout: LayoutId;
  /** Customisable colour slots. Display name and hint live in messages.templates.items. */
  slots: readonly ColourSlot[];
  /** Visual-mockup treatment, kept in step with the preview layout. */
  mockup: MockupStyle;
};

/**
 * Photo metadata carried by the customer draft. The pixels themselves stay in the
 * in-memory photo store (`src/projects/photo-store.ts`) under `id`; only this
 * serialisable metadata travels with the draft, so the draft stays small JSON.
 */
export type PhotoMeta = {
  id: string;
  /** Original file name, kept for display only. */
  name: string;
  /** Validated MIME type: image/jpeg, image/png or image/webp. */
  type: string;
  sizeBytes: number;
  /** Natural dimensions of the original photo, in pixels. */
  width: number;
  height: number;
  /** SHA-256 of the original bytes, as lowercase hex. Stable content identity. */
  sha256: string;
};

/**
 * A rectangular selection on the photo, normalised to the natural image size:
 * every component is a fraction in 0..1. Normalised coordinates are
 * resolution-independent and convert to a pixel mask at generation time, which is
 * what future AI inpainting and the Professional Studio transfer need.
 */
export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
