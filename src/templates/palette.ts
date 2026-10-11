import type { ColourId, ColourOption, ColourRole, ColourSlot } from "./types";

/**
 * Named colour palette offered to customers. Every value is a foreground colour for
 * the dark sign scenes in the preview, so each one must meet WCAG AA (4.5:1) against
 * the page background; templates.test.ts enforces that. Display names live in
 * messages.colours.names and are required in all three locales.
 */
export const colourPalette: Record<ColourId, string> = {
  cyan: "#22d3ee",
  azure: "#7dd3fc",
  teal: "#2dd4bf",
  emerald: "#34d399",
  amber: "#fbbf24",
  gold: "#facc15",
  coral: "#fb7185",
  rose: "#f472b6",
  violet: "#a78bfa",
  ice: "#dff4ff",
  warmWhite: "#fdeecf",
  graphite: "#9aa7b5",
  silver: "#d3dce6",
  copper: "#e8a76c",
};

/** Builds a colour slot from palette ids. The first id is the default. */
export function slot(role: ColourRole, ids: readonly [ColourId, ...ColourId[]]): ColourSlot {
  const options: ColourOption[] = ids.map((id) => ({ id, value: colourPalette[id] }));
  return { role, defaultId: ids[0], options };
}

/** Hex values for all slots of a template, filled with each slot's default. */
export function defaultColourValues(template: {
  slots: readonly ColourSlot[];
}): Record<ColourRole, string> {
  const values = { face: colourPalette.ice, glow: colourPalette.cyan, accent: colourPalette.azure };
  for (const s of template.slots) {
    values[s.role] = colourPalette[s.defaultId];
  }
  return values;
}
