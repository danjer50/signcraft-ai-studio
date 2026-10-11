import type { ReactNode } from "react";

import type { EmblemId } from "@/templates/types";

/**
 * The emblem library: small geometric marks drawn as inline SVG strokes, tinted
 * with the template's colours (currentColor). Each emblem is a deliberate graphic
 * element of a complete sign composition — scissors for a barber, a coffee cup for
 * a café, a cross for a pharmacy, and so on. Emblems are decorative; the sign text
 * carries the meaning, so every emblem is aria-hidden. Structured data (never
 * dangerouslySetInnerHTML): each mark is a list of circles, rects and paths.
 */

type Circle = { t: "circle"; cx: number; cy: number; r: number };
type Rect = { t: "rect"; x: number; y: number; w: number; h: number; rx?: number };
type Path = { t: "path"; d: string };
type EmblemMark = Circle | Rect | Path;

const EMBLEMS: Record<Exclude<EmblemId, "none">, readonly EmblemMark[]> = {
  scissors: [
    { t: "circle", cx: 6, cy: 7, r: 2.2 },
    { t: "circle", cx: 6, cy: 17, r: 2.2 },
    { t: "path", d: "M8.2 8.4 20 17M8.2 15.6 20 7" },
  ],
  coffeeCup: [
    { t: "path", d: "M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" },
    { t: "path", d: "M16 10h1.8a2.4 2.4 0 0 1 0 4.8H16" },
    { t: "path", d: "M8.5 5.5c0-1 .9-1 .9-2M12.5 5.5c0-1 .9-1 .9-2" },
  ],
  cross: [
    { t: "circle", cx: 12, cy: 12, r: 8.5 },
    { t: "path", d: "M12 8v8M8 12h8" },
  ],
  star: [
    { t: "path", d: "m12 4 2.2 4.9 5.3.6-4 3.6 1.1 5.2L12 15.6l-4.6 2.7 1.1-5.2-4-3.6 5.3-.6z" },
  ],
  gear: [
    { t: "circle", cx: 12, cy: 12, r: 3 },
    {
      t: "path",
      d: "M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1",
    },
  ],
  leaf: [
    { t: "path", d: "M5 19C5 10 11 5 19 5c0 8-5 14-14 14z" },
    { t: "path", d: "M5 19c3-6 7-9 11-11" },
  ],
  crown: [
    { t: "path", d: "M4 16.5 3 7.5l5.5 4L12 5l3.5 6.5 5.5-4-1 9z" },
    { t: "path", d: "M5.5 20h13" },
  ],
  phone: [
    { t: "rect", x: 7, y: 3, w: 10, h: 18, rx: 2 },
    { t: "path", d: "M10.5 18h3" },
  ],
  car: [
    { t: "path", d: "M4 16v-2l2-5h12l2 5v2" },
    { t: "path", d: "M3 16h18v2H3z" },
    { t: "circle", cx: 7, cy: 18, r: 1.7 },
    { t: "circle", cx: 17, cy: 18, r: 1.7 },
  ],
  dumbbell: [
    { t: "path", d: "M8.5 12h7" },
    { t: "rect", x: 4, y: 8, w: 2.6, h: 8, rx: 1 },
    { t: "rect", x: 17.4, y: 8, w: 2.6, h: 8, rx: 1 },
  ],
  croissant: [
    { t: "path", d: "M4 17a8 8 0 0 1 16 0" },
    { t: "path", d: "M8 17a4 4 0 0 1 8 0" },
    { t: "path", d: "M12 9.5V17M7.5 11.5l2 5.5M16.5 11.5l-2 5.5" },
  ],
  key: [
    { t: "circle", cx: 8, cy: 12, r: 3.5 },
    { t: "path", d: "M11.5 12H20M17 12v3M20 12v2.5" },
  ],
  house: [
    { t: "path", d: "m4 11 8-7 8 7" },
    { t: "path", d: "M6 10v9h12v-9" },
    { t: "path", d: "M10 19v-5h4v5" },
  ],
  wrench: [
    {
      t: "path",
      d: "M20 7.5a4.5 4.5 0 0 1-6.2 4L7 18.3a2 2 0 0 1-2.8-2.8l6.8-6.8a4.5 4.5 0 0 1 4-6.2L12.5 5 15 7.5z",
    },
  ],
  bolt: [{ t: "path", d: "M13 3 5 13h5l-1 8 8-10h-5z" }],
  diamond: [
    { t: "path", d: "m12 4 6 6-6 10-6-10z" },
    { t: "path", d: "M6 10h12M12 4 9.5 10 12 20l2.5-10z" },
  ],
  flourish: [
    { t: "path", d: "M3 17c5 0 5-10 9-10 3 0 3 6 6 6 2 0 3-2 3-4" },
    { t: "path", d: "M3 13c5 0 5-10 9-10" },
  ],
  tooth: [
    {
      t: "path",
      d: "M8 4C5.5 4 4 6 4 8.5c0 4 1.5 5 2 8 .3 1.8 1 3 2 3s1.2-1.5 1.5-3c.2-1.2.8-2 1.5-2s1.3.8 1.5 2c.3 1.5.8 3 1.8 3s1.7-1.2 2-3c.5-3 2-4 2-8C20 6 18.5 4 16 4c-1.8 0-2.7 1-4 1s-2.2-1-4-1z",
    },
  ],
  hammer: [
    { t: "path", d: "m14 4 6 6-2 2-6-6z" },
    { t: "path", d: "M12 8 4 16l4 4 8-8" },
  ],
  shirt: [{ t: "path", d: "M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8z" }],
  apple: [
    {
      t: "path",
      d: "M12 7c-1-1.5-3-2-4.5-1C5 7.5 4.5 11 6 14.5 7 17 9 19.5 12 19.5s5-2.5 6-5c1.5-3.5 1-7-1.5-8.5C15 5 13 5.5 12 7z",
    },
    { t: "path", d: "M12 7c0-2 1-3 2.5-3.5" },
  ],
  signPanel: [
    { t: "rect", x: 4, y: 5, w: 16, h: 10, rx: 2 },
    { t: "path", d: "M12 15v4M8 21h8M9 10h6" },
  ],
  paintbrush: [
    { t: "path", d: "m15 4 5 5-8 8H7v-5z" },
    { t: "path", d: "M7 17c-1.5 1.5-1.5 3-4 3 0-2.5 1.5-2.5 3-4" },
  ],
  heart: [
    {
      t: "path",
      d: "M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.5 12 20 12 20z",
    },
  ],
};

type EmblemIconProps = {
  emblem: EmblemId;
  className?: string;
};

function renderMark(mark: EmblemMark, index: number): ReactNode {
  switch (mark.t) {
    case "circle":
      return <circle key={index} cx={mark.cx} cy={mark.cy} r={mark.r} />;
    case "rect":
      return <rect key={index} x={mark.x} y={mark.y} width={mark.w} height={mark.h} rx={mark.rx} />;
    case "path":
      return <path key={index} d={mark.d} />;
  }
}

/**
 * Renders one emblem from the library. `none` renders nothing. The emblem inherits
 * the template's face/accent colour through currentColor.
 */
export function EmblemIcon({ emblem, className }: EmblemIconProps) {
  if (emblem === "none") {
    return null;
  }
  const marks = EMBLEMS[emblem];
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {marks.map(renderMark)}
    </svg>
  );
}
