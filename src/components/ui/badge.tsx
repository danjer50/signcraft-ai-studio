import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import styles from "./badge.module.css";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span data-tone={tone} className={cx(styles.badge, className)}>
      {children}
    </span>
  );
}
