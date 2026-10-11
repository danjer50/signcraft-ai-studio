import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${fileURLToPath(new URL("./src", import.meta.url))}/`,
      },
    ],
  },
  test: {
    // happy-dom instead of jsdom: jsdom's optional native `canvas` peer breaks npm 10's
    // dependency resolver in this environment. See docs/ARCHITECTURE.md.
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    // functions/**/*.test.ts run in Node (node:sqlite D1 adapter); the pragma at the top
    // of each file switches the environment, the default stays happy-dom for the UI.
    include: ["src/**/*.test.{ts,tsx}", "functions/**/*.test.ts"],
  },
});
