import { defineConfig } from "@playwright/test";

/*
 * Browser tests. They run against the production build, so run `npm run build` first. Playwright
 * starts `next start` itself and always starts a fresh server, so a stale build cannot pass.
 *
 * Browsers: `npx playwright install chromium` downloads the matching Chromium. Set
 * E2E_CHROMIUM_PATH to use a Chromium binary that is already installed, for machines where that
 * download is blocked.
 */
const port = Number(process.env.E2E_PORT ?? 3123);
const baseURL = `http://127.0.0.1:${port}`;
const chromiumPath = process.env.E2E_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },
  // Representative widths: a phone, the width where the drawer is still used (below 64rem), and
  // a desktop with the permanent sidebar.
  projects: [
    {
      name: "mobile",
      use: { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true },
    },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
