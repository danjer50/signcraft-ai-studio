import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import styles from "./card.module.css";

type CardProps = {
  as?: "div" | "section" | "article";
  className?: string;
  children: ReactNode;
};

export function Card({ as: Component = "div", className, children }: CardProps) {
  return <Component className={cx(styles.card, className)}>{children}</Component>;
}
