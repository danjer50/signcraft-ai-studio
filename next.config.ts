import type { NextConfig } from "next";

/**
 * The app is fully static: every page is prerendered and there is no server code in
 * Next itself. `output: "export"` is the build mode for Cloudflare Pages (Milestone 5):
 * `next build` writes the static site to `out/`, and the dynamic parts (the auth API)
 * run as Pages Functions (`functions/`), which `wrangler pages dev` serves alongside.
 *
 * Two config features do not exist in a static export and moved to Pages files:
 * the security headers (`headers()` → `public/_headers`) and the `/` → `/fr` redirect
 * (`redirects()` → `public/_redirects`). The locale-header proxy (`src/proxy.ts`) is
 * gone: the exported `404.html` detects the locale in the browser instead — see
 * `src/app/global-not-found.tsx` and `public/not-found-locale.js`.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  images: {
    // next/image optimisation needs a server; the exported site uses plain files.
    unoptimized: true,
  },
  experimental: {
    // The root not-found boundary renders the exported 404.html, so one document
    // serves every unknown URL. Experimental in Next.js 16.4, so the version is
    // pinned exactly in package.json. See docs/ARCHITECTURE.md, section 4.
    globalNotFound: true,
  },
};

export default nextConfig;
