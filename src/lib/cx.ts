/** Joins class names, skipping empty values. Keeps component code free of template-string noise. */
export function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
