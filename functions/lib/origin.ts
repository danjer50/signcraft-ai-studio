import { forbidden } from "./errors";

/**
 * CSRF guard for state-changing requests (security-review amendment). Mutations are
 * POST-only; a browser form or fetch from another site sends `Sec-Fetch-Site:
 * cross-site` and (for fetch with CORS) an `Origin` header. SameSite=Lax cookies
 * already block cross-site POSTs from being authenticated, and these checks reject
 * the request itself.
 *
 * Requests without browser headers (curl, tests, server-to-server) carry no
 * Sec-Fetch-Site and no Origin, so they pass — the session cookie is what
 * authenticates them.
 */
export function assertSameOrigin(request: Request): void {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (
    secFetchSite !== null &&
    secFetchSite !== "same-origin" &&
    secFetchSite !== "same-site" &&
    secFetchSite !== "none"
  ) {
    throw forbidden("cross_site_request");
  }

  const origin = request.headers.get("origin");
  if (origin !== null) {
    let originUrl: URL;
    try {
      originUrl = new URL(origin);
    } catch {
      throw forbidden("cross_site_request");
    }
    const requestUrl = new URL(request.url);
    if (originUrl.host !== requestUrl.host || originUrl.protocol !== requestUrl.protocol) {
      throw forbidden("cross_site_request");
    }
  }
}
