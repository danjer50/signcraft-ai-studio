import { defaultDraft, parseDraft, type CustomerDraft } from "@/templates/draft";

/**
 * The structured sign project: the shared model between Normal Mode and the
 * Professional Studio. It carries the customer's design (the draft — template,
 * text, colours, lettering) plus the professional fabrication properties.
 *
 * Design templates, construction, material, lighting and finish are SEPARATE
 * concepts: a template is a complete graphic composition; construction says how
 * the sign is physically built; material what it is made of; lighting how it is
 * illuminated; finish how the surface looks. None of them is a template.
 */

export type ConstructionId =
  "wallPanel" | "alucobond" | "channelLetters" | "projecting" | "reception" | "totem";

export type MaterialId = "alucobond" | "acrylic" | "pvc" | "steel";

export type LightingId = "none" | "frontLit" | "backlit" | "halo";

export type FinishId = "matte" | "gloss" | "brushed" | "chrome";

/** Ordered option lists for the pickers. */
export const constructionIds: readonly ConstructionId[] = [
  "wallPanel",
  "alucobond",
  "channelLetters",
  "projecting",
  "reception",
  "totem",
];
export const materialIds: readonly MaterialId[] = ["alucobond", "acrylic", "pvc", "steel"];
export const lightingIds: readonly LightingId[] = ["none", "frontLit", "backlit", "halo"];
export const finishIds: readonly FinishId[] = ["matte", "gloss", "brushed", "chrome"];

/** Physical dimensions in millimetres — the fabrication source of truth. */
export type PhysicalSpec = {
  /** Overall sign width. */
  widthMm: number;
  /** Overall sign height. */
  heightMm: number;
  /**
   * Depth: the panel thickness for wall-mounted signs, the projection distance
   * for projecting signs. Interpreted per construction by the side view.
   */
  depthMm: number;
  units: "mm";
};

export const PROJECT_VERSION = 1 as const;

export type SignProject = {
  version: typeof PROJECT_VERSION;
  /** The shared design data: the customer draft (template, text, colours, lettering). */
  draft: CustomerDraft;
  construction: ConstructionId;
  material: MaterialId;
  lighting: LightingId;
  finish: FinishId;
  physical: PhysicalSpec;
};

export const MIN_WIDTH_MM = 50;
export const MAX_WIDTH_MM = 5000;
export const MIN_HEIGHT_MM = 50;
export const MAX_HEIGHT_MM = 3000;
export const MIN_DEPTH_MM = 5;
export const MAX_DEPTH_MM = 1000;

function clampMm(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

/** Clamps a physical spec into the supported fabrication ranges. */
export function clampPhysical(spec: PhysicalSpec): PhysicalSpec {
  return {
    widthMm: clampMm(spec.widthMm, MIN_WIDTH_MM, MAX_WIDTH_MM),
    heightMm: clampMm(spec.heightMm, MIN_HEIGHT_MM, MAX_HEIGHT_MM),
    depthMm: clampMm(spec.depthMm, MIN_DEPTH_MM, MAX_DEPTH_MM),
    units: "mm",
  };
}

/** A sensible default spec for a medium wall panel. */
export function defaultPhysicalSpec(): PhysicalSpec {
  return { widthMm: 900, heightMm: 300, depthMm: 30, units: "mm" };
}

/** Builds a project around an existing design draft (Normal Mode → Pro handoff). */
export function projectFromDraft(draft: CustomerDraft): SignProject {
  return {
    version: PROJECT_VERSION,
    draft,
    construction: "wallPanel",
    material: "alucobond",
    lighting: "none",
    finish: "matte",
    physical: defaultPhysicalSpec(),
  };
}

/** A fresh project with the default draft. */
export function defaultProject(): SignProject {
  return projectFromDraft(defaultDraft());
}

export function serializeProject(project: SignProject): string {
  return JSON.stringify(project);
}

const constructionSet = new Set<string>(constructionIds);
const materialSet = new Set<string>(materialIds);
const lightingSet = new Set<string>(lightingIds);
const finishSet = new Set<string>(finishIds);

function parsePhysical(value: unknown): PhysicalSpec | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const width = Number(record.widthMm);
  const height = Number(record.heightMm);
  const depth = Number(record.depthMm);
  if (![width, height, depth].every(Number.isFinite)) {
    return null;
  }
  return clampPhysical({ widthMm: width, heightMm: height, depthMm: depth, units: "mm" });
}

/**
 * Parses a project. Returns null for anything malformed: wrong version, an
 * invalid draft, unknown construction/material/lighting/finish ids, or invalid
 * dimensions. The embedded draft is parsed with the same strict rules.
 */
export function parseProject(raw: string): SignProject | null {
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
  if (record.version !== PROJECT_VERSION) {
    return null;
  }
  if (record.draft === undefined) {
    return null;
  }
  // The embedded draft is validated with the draft's own strict rules.
  const parsedDraft = parseDraft(JSON.stringify(record.draft));
  if (parsedDraft === null) {
    return null;
  }
  if (!constructionSet.has(record.construction as string)) {
    return null;
  }
  if (!materialSet.has(record.material as string)) {
    return null;
  }
  if (!lightingSet.has(record.lighting as string)) {
    return null;
  }
  if (!finishSet.has(record.finish as string)) {
    return null;
  }
  const physical = parsePhysical(record.physical);
  if (physical === null) {
    return null;
  }
  return {
    version: PROJECT_VERSION,
    draft: parsedDraft,
    construction: record.construction as ConstructionId,
    material: record.material as MaterialId,
    lighting: record.lighting as LightingId,
    finish: record.finish as FinishId,
    physical,
  };
}

/** True for constructions that physically project away from the wall. */
export function isProjecting(construction: ConstructionId): boolean {
  return construction === "projecting";
}
