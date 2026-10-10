import { expect, type Page } from "@playwright/test";

/**
 * Whether a console error is the expected 404 of a URL that the test requests on purpose.
 * Chrome logs every response with an error status, and Next.js also requests the RSC payload
 * of a route when the user navigates to it. Both are allowed, but only for the exact paths the
 * test names. Every other error fails the test.
 */
function isExpectedNotFound(location: string, text: string, paths: readonly string[]): boolean {
  if (!text.includes("status of 404")) return false;
  try {
    const pathname = new URL(location).pathname;
    // The RSC payload of a route is requested as `<path>.txt`; on the static export
    // an unknown route's payload is the 404 document, which is the same expected 404.
    return paths.some((path) => pathname === path || pathname === `${path}.txt`);
  } catch {
    return false;
  }
}

/**
 * Collects the console errors and uncaught exceptions of a page. `expectedNotFoundPaths` lists
 * the unknown paths the test opens on purpose; see `isExpectedNotFound`.
 */
export function trackUnexpectedErrors(
  page: Page,
  expectedNotFoundPaths: readonly string[] = [],
): string[] {
  const unexpected: string[] = [];

  page.on("pageerror", (error) => {
    unexpected.push(`uncaught exception: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (isExpectedNotFound(message.location().url, message.text(), expectedNotFoundPaths)) return;
    unexpected.push(`console error at ${message.location().url}: ${message.text()}`);
  });

  return unexpected;
}

/** Fails when the page is wider than the viewport, which would let the user scroll sideways. */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow in pixels").toBeLessThanOrEqual(0);
}
