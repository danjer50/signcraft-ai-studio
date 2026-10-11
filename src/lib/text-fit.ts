/**
 * Deterministic helpers for sign text: script detection (Arabic must never get
 * letter-spacing, which breaks cursive joining) and measurement-based fitting so
 * long business names shrink instead of clipping or overflowing the sign board.
 */

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** True when the text contains Arabic-script characters. */
export function isArabicText(text: string): boolean {
  return ARABIC_RANGE.test(text);
}

export const MIN_FIT_SCALE = 0.45;

/**
 * Scale factor for a text element inside a container: 1 when it fits, smaller when
 * it would overflow. Never below MIN_FIT_SCALE; callers combine this with wrapping.
 */
export function computeFitScale(
  textWidth: number,
  containerWidth: number,
  minScale: number = MIN_FIT_SCALE,
): number {
  if (!Number.isFinite(textWidth) || !Number.isFinite(containerWidth)) return 1;
  if (containerWidth <= 0) return minScale;
  if (textWidth <= containerWidth) return 1;
  return Math.max(minScale, containerWidth / textWidth);
}

/**
 * Whether a business name is long enough to wrap onto a second line instead of
 * shrinking below a readable size. Short names stay on one line at full size.
 */
export function shouldWrapName(text: string, maxCharsPerLine = 18): boolean {
  const trimmed = text.trim();
  return trimmed.length > maxCharsPerLine && !trimmed.includes("\n");
}
