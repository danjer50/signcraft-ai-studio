import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  className?: string;
};

/**
 * Class names for the button look. Use this on a Next.js <Link> when the control has to
 * navigate, so the link and a real <button> look identical.
 */
export function buttonClassName({
  variant = "primary",
  className,
}: ButtonStyleOptions = {}): string {
  return cx(styles.button, styles[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      data-variant={variant}
      className={buttonClassName({ variant, className })}
    />
  );
}
