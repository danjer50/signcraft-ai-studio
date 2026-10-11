import type { Locale } from "@/i18n/config";

/**
 * Primary navigation. Only `available` routes are links. Planned sections are shown
 * as labelled "Planned" rows, so nothing links to a page that does not exist yet.
 * `segment` reserves the future route name for each section.
 */
export type NavKey =
  "home" | "create" | "pro" | "projects" | "design2d" | "geometry3d" | "mockups" | "exports";

export type NavItem = {
  key: NavKey;
  segment: string;
  available: boolean;
};

export const navigationItems: readonly NavItem[] = [
  // The Pro workspace is intentionally NOT a public navigation destination: it is
  // reachable only through Connection / Login with a valid access code or account
  // (product requirement). Keep the key in NavKey for icons and copy, not for nav.
  { key: "home", segment: "", available: true },
  { key: "create", segment: "create", available: true },
  { key: "projects", segment: "projects", available: false },
  { key: "design2d", segment: "design", available: false },
  { key: "geometry3d", segment: "geometry", available: false },
  { key: "mockups", segment: "mockups", available: false },
  { key: "exports", segment: "exports", available: false },
];

export function navigationHref(locale: Locale, item: NavItem): string {
  return item.segment ? `/${locale}/${item.segment}` : `/${locale}`;
}
