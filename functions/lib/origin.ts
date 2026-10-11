import { forbidden } from "./errors";

/**
 * CSRF guard for state-changing requests (security-review amendment). Mutations are
 * POST-only; a browser form or fetch from another site sends `Sec-Fetch-Site:
 * cross-site` and an `Origin` header. SameSite=Lax cookies already block cross-site
 * POSTs from being authenticated, and these checks reject the request itself.
 *
 * Requests without browser headers (curl, tests, server-to-server) carry no
 * Sec-Fetch-Site and no Origin, so they pass — the session cookie is what
 * authenticates them.
 *
 * The Origin check compares HOSTS, not schemes. The host is the CSRF discriminator: a
 * foreign origin has a foreign host and is rejected. The scheme is deliberately not
 * compared — behind a TLS-terminating proxy the worker sees the proxy hop's scheme
 * (http) while the browser used https, and dev stacks rewrite a same-host Origin's
 * scheme to the request scheme, so a scheme comparison would reject legitimate
 * proxied requests (and never rejects a foreign origin, which the host check catches).
 * `X-Forwarded-Host` is honoured when the proxy rewrites the Host header, so the
 * comparison uses the EFFECTIVE host: the forwarded value when present, the request
 * URL's host otherwise. This stays safe: browsers set `Origin` (an attacker cannot
 * forge it on the victim's behalf — foreign origins arrive unmodified and are
 * rejected), the proxy is trusted infrastructure, and SameSite=Lax remains the primary
 * CSRF control: a raw request with forged forwarded headers carries no victim cookie.
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
  if (origin === null) {
    return;
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw forbidden("cross_site_request");
  }

  // X-Forwarded-Host may be a list; the first entry is the original host.
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const effectiveHost = forwardedHost ?? new URL(request.url).host;

  if (originUrl.host !== effectiveHost) {
    throw forbidden("cross_site_request");
  }
}
