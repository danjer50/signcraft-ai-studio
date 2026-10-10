/*
 * Minimal inline icon set. Icons are decorative (aria-hidden); the label next to each
 * icon carries the meaning. Stroke-based, so colour follows the surrounding text.
 */
import type { SVGProps } from "react";

import { cx } from "@/lib/cx";

import styles from "./icons.module.css";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
      className={cx(styles.icon, className)}
    >
      {children}
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-4.5v-6h-6v6H4a.5.5 0 0 1-.5-.5z" />
    </Icon>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
    </Icon>
  );
}

export function CanvasIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v16M4 9h16" />
    </Icon>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </Icon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6z" />
      <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
    </Icon>
  );
}

export function WandIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20 14.5 9.5M16 4.5l.9 2.6 2.6.9-2.6.9L16 11.5l-.9-2.6-2.6-.9 2.6-.9zM6.5 4l.6 1.6 1.6.6-1.6.6L6.5 8.4l-.6-1.6-1.6-.6 1.6-.6z" />
      <path d="M13.2 14.2 17 18a1.2 1.2 0 0 1-1.7 1.7l-3.8-3.8" />
    </Icon>
  );
}

export function CaseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="1.5" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17" />
    </Icon>
  );
}

/** Brand mark: a rounded tile with sign-like lines. Filled, not stroked. */
export function BrandMark(props: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      {...props}
      className={cx(styles.brandMark, props.className)}
    >
      {/* Sign-panel tile */}
      <rect x="1.5" y="1.5" width="45" height="45" rx="11" className={styles.brandTile} />
      {/* Dimensional depth: the same S offset behind the face, in ultraviolet */}
      <path
        d="M15 15 H37 V22 H22 V26 H15 Z M15 37 H37 V26 H30 V30 H15 Z"
        className={styles.brandDepth}
      />
      {/* The S face: top bar + left stem in magenta, right stem + bottom bar in cyan */}
      <path d="M13 13 H35 V20 H20 V24 H13 Z" className={styles.brandSlabTop} />
      <path d="M13 35 H35 V24 H28 V28 H13 Z" className={styles.brandSlabBottom} />
    </svg>
  );
}
