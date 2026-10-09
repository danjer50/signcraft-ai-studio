import type { NextConfig } from "next";

import { defaultLocale } from "./src/i18n/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Renders unknown URLs as a full document with the right `lang` and `dir` for the locale.
    // Experimental in Next.js 16.4, so the version is pinned exactly in package.json.
    // Without it, a not-found page inside a locale route cannot be server-rendered; see
    // docs/ARCHITECTURE.md, section 4.
    globalNotFound: true,
  },
  async redirects() {
    // The root path has no content of its own; send visitors to the default locale.
    return [
      {
        source: "/",
        destination: `/${defaultLocale}`,
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
