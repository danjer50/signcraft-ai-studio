import type { Messages } from "@/i18n/messages/en";
import {
  isProjecting,
  type FinishId,
  type MaterialId,
  type PhysicalSpec,
  type ConstructionId,
} from "@/projects/sign-project";

import styles from "./side-view.module.css";

/**
 * The side (profile) view of the sign: a real, dimensioned representation built
 * from the project's physical model — NOT a rotated front-view image. It shows
 * the wall, the panel at its actual thickness or projection, the mounting
 * bracket for projecting signs, and the height/depth dimensions in millimetres.
 */

export type SideViewGeometry = {
  /** Pixels per millimetre. */
  scale: number;
  /** Wall band: x, width (the wall is drawn on the inline-start side). */
  wall: { x: number; width: number };
  /** Panel rectangle in viewBox coordinates. */
  panel: { x: number; y: number; width: number; height: number };
  /** Bracket points (projecting signs only). */
  bracket: { x1: number; y1: number; x2: number; y2: number } | null;
  /** Dimension label positions. */
  labels: { height: { x: number; y: number }; depth: { x: number; y: number } };
};

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 220;
const MARGIN = 28;

/**
 * Computes the scaled side-view geometry for a physical spec. Wall-mounted
 * signs show the panel as a thin slab against the wall (depth = thickness);
 * projecting signs show the panel perpendicular to the wall with a bracket
 * (depth = projection distance).
 */
export function computeSideViewGeometry(
  spec: PhysicalSpec,
  construction: ConstructionId,
): SideViewGeometry {
  const projecting = isProjecting(construction);
  const horizontalMm = projecting ? spec.depthMm : spec.depthMm;
  // Fit the height into the vertical area and the depth/projection into half
  // the horizontal area; the wall and labels take the rest.
  const scale = Math.min(
    (VIEW_HEIGHT - 2 * MARGIN) / spec.heightMm,
    (VIEW_WIDTH * 0.45) / Math.max(horizontalMm, 1),
  );
  const panelHeight = spec.heightMm * scale;
  const panelThickness = Math.max(spec.depthMm * scale, 3);
  const wallWidth = 14;
  const wallX = MARGIN;
  const panelY = MARGIN + ((VIEW_HEIGHT - 2 * MARGIN - panelHeight) / 2);

  if (projecting) {
    // The panel stands perpendicular to the wall, projecting away from it.
    const projection = spec.depthMm * scale;
    const panelX = wallX + wallWidth + projection;
    return {
      scale,
      wall: { x: wallX, width: wallWidth },
      panel: { x: panelX, y: panelY, width: Math.max(projection, 6), height: panelHeight },
      bracket: {
        x1: wallX + wallWidth,
        y1: panelY + panelHeight * 0.25,
        x2: panelX,
        y2: panelY + panelHeight * 0.25,
      },
      labels: {
        height: { x: wallX - 10, y: panelY + panelHeight / 2 },
        depth: { x: wallX + wallWidth + projection / 2, y: panelY + panelHeight + 16 },
      },
    };
  }

  // Wall-mounted: the panel is a thin slab flat against the wall.
  const panelX = wallX + wallWidth;
  return {
    scale,
    wall: { x: wallX, width: wallWidth },
    panel: { x: panelX, y: panelY, width: panelThickness, height: panelHeight },
    bracket: null,
    labels: {
      height: { x: wallX - 10, y: panelY + panelHeight / 2 },
      depth: { x: panelX + panelThickness / 2, y: panelY + panelHeight + 16 },
    },
  };
}

const MATERIAL_FILL: Record<MaterialId, string> = {
  alucobond: "rgb(38 30 66 / 0.95)",
  acrylic: "rgb(143 251 255 / 0.28)",
  pvc: "rgb(247 245 255 / 0.22)",
  steel: "rgb(150 140 175 / 0.55)",
};

type SideViewProps = {
  messages: Messages;
  physical: PhysicalSpec;
  construction: ConstructionId;
  material: MaterialId;
  finish: FinishId;
};

/**
 * Renders the side view SVG: wall, panel at real proportions, bracket for
 * projecting signs, and the height/depth dimensions in millimetres.
 */
export function SideView({ messages, physical, construction, material, finish }: SideViewProps) {
  const copy = messages.pro.sideView;
  const geometry = computeSideViewGeometry(physical, construction);
  const { wall, panel, bracket, labels } = geometry;
  const projecting = isProjecting(construction);

  const finishStroke =
    finish === "chrome"
      ? "var(--color-accent-strong)"
      : finish === "gloss"
        ? "rgb(247 245 255 / 0.7)"
        : finish === "brushed"
          ? "rgb(247 245 255 / 0.35)"
          : "rgb(247 245 255 / 0.18)";

  return (
    <figure className={styles.frame}>
      <figcaption className={styles.title}>{copy.title}</figcaption>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={copy.title}
        className={styles.svg}
      >
        {/* Wall band */}
        <rect x={wall.x} y={MARGIN - 8} width={wall.width} height={VIEW_HEIGHT - 2 * MARGIN + 16} className={styles.wall} />
        {/* Panel */}
        <rect
          x={panel.x}
          y={panel.y}
          width={panel.width}
          height={panel.height}
          fill={MATERIAL_FILL[material]}
          stroke={finishStroke}
          strokeWidth={finish === "matte" ? 1.5 : 2}
          rx={2}
        />
        {/* Bracket for projecting signs */}
        {bracket !== null && (
          <line
            x1={bracket.x1}
            y1={bracket.y1}
            x2={bracket.x2}
            y2={bracket.y2}
            className={styles.bracket}
          />
        )}
        {/* Height dimension (vertical) */}
        <line
          x1={labels.height.x}
          y1={panel.y}
          x2={labels.height.x}
          y2={panel.y + panel.height}
          className={styles.dimension}
        />
        <text x={labels.height.x - 4} y={labels.height.y} className={styles.dimensionText} textAnchor="end">
          {physical.heightMm} mm
        </text>
        {/* Depth / projection dimension (horizontal) */}
        <line
          x1={wall.x + wall.width}
          y1={labels.depth.y - 6}
          x2={panel.x + (projecting ? panel.width : panel.width)}
          y2={labels.depth.y - 6}
          className={styles.dimension}
        />
        <text x={labels.depth.x} y={labels.depth.y + 4} className={styles.dimensionText} textAnchor="middle">
          {projecting ? copy.projection : copy.thickness} {physical.depthMm} mm
        </text>
      </svg>
      <p className={styles.caption}>{projecting ? copy.projectingNote : copy.wallNote}</p>
    </figure>
  );
}
