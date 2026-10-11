import { usePathname } from "next/navigation";

/**
 * The current pathname. Next.js can return null here while it renders a not-found boundary,
 * so this returns "" in that case and callers never see null.
 */
export function useCurrentPathname(): string {
  return usePathname() ?? "";
}
