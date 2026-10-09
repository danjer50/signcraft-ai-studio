import { NextResponse, type NextRequest } from "next/server";

import { DISPLAY_LOCALE_HEADER, localeForPathname } from "@/i18n/display-locale";

/**
 * Stores the display locale of each request in a header, so the global not-found page can show
 * the right language. The header is set for every request, so a value sent by the client is
 * always replaced. Only app/global-not-found.tsx reads it, so the other pages stay statically
 * rendered.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(DISPLAY_LOCALE_HEADER, localeForPathname(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Next.js internals and the icon never render a page or a 404, so the proxy skips them.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
