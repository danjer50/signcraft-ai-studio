import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";

export default defineConfig([
  // .wrangler/ is wrangler's local dev state (bundled Functions), not source.
  globalIgnores([
    ".next/**",
    "out/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    ".wrangler/**",
  ]),
  ...nextVitals,
  ...nextTypeScript,
  {
    // Repository scripts run in Node, not in the browser.
    files: ["scripts/**/*.mjs", "*.config.{mjs,mts,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Keep last: turns off stylistic rules that Prettier owns.
  prettier,
]);
