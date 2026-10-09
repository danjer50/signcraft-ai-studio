#!/usr/bin/env node
/**
 * Smoke test for the production build.
 *
 * It starts `next start` on a free local port, requests the important routes, checks the
 * HTML and HTTP behaviour, then stops the server. Run `npm run build` first.
 * Requires a POSIX system (uses process groups to stop the server).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const STARTUP_TIMEOUT_MS = 60_000;
const REQUEST_TIMEOUT_MS = 10_000;

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

async function get(base, pathname) {
  const response = await fetch(new URL(pathname, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

async function waitUntilReady(base, server) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited early with code ${server.exitCode}`);
    }
    try {
      await get(base, "/fr");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`next start did not respond within ${STARTUP_TIMEOUT_MS} ms`);
}

function stopServer(server) {
  return new Promise((resolve) => {
    if (server.exitCode !== null || server.signalCode !== null) {
      resolve();
      return;
    }
    const forceTimer = setTimeout(() => {
      try {
        process.kill(-server.pid, "SIGKILL");
      } catch {
        // The group has already exited.
      }
    }, 5_000);
    server.once("exit", () => {
      clearTimeout(forceTimer);
      resolve();
    });
    try {
      // Negative pid signals the whole process group, including Next's worker process.
      process.kill(-server.pid, "SIGTERM");
    } catch {
      clearTimeout(forceTimer);
      resolve();
    }
  });
}

function h1Text(html) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : "";
}

const localePages = [
  { locale: "fr", lang: "fr", dir: "ltr" },
  { locale: "en", lang: "en", dir: "ltr" },
  { locale: "ar", lang: "ar", dir: "rtl" },
];

async function runChecks(base) {
  // Root redirects to the default locale.
  const root = await get(base, "/");
  const rootTarget = root.headers.get("location");
  check(
    "GET / redirects (307) to /fr",
    root.status === 307 && rootTarget !== null && new URL(rootTarget, base).pathname === "/fr",
    `status ${root.status}, location ${rootTarget}`,
  );

  for (const { locale, lang, dir } of localePages) {
    const page = await get(base, `/${locale}`);
    const htmlTag = page.body.match(/<html\b[^>]*>/i)?.[0] ?? "";

    check(`GET /${locale} returns 200`, page.status === 200, `status ${page.status}`);
    check(
      `/${locale} sets lang="${lang}" and dir="${dir}" on <html>`,
      new RegExp(`\\blang="${lang}"`).test(htmlTag) && new RegExp(`\\bdir="${dir}"`).test(htmlTag),
      htmlTag || "no <html> tag",
    );
    check(`/${locale} has exactly one <h1>`, (page.body.match(/<h1\b/gi) ?? []).length === 1);
    check(
      `/${locale} has a skip link to #main-content`,
      page.body.includes('href="#main-content"'),
    );
    check(`/${locale} has the main landmark target`, page.body.includes('id="main-content"'));
    check(
      `/${locale} links to no unbuilt sections`,
      !/href="\/[a-z]{2}\/(projects|design|geometry|mockups|exports)"/.test(page.body),
    );
    check(
      `/${locale} sends X-Content-Type-Options: nosniff`,
      page.headers.get("x-content-type-options") === "nosniff",
    );
    check(`/${locale} does not expose X-Powered-By`, !page.headers.has("x-powered-by"));
  }

  const arabicHeading = h1Text((await get(base, "/ar")).body);
  check(
    "/ar heading is written in Arabic script",
    /[\u0600-\u06FF]/.test(arabicHeading),
    arabicHeading,
  );

  for (const unknown of ["/fr/does-not-exist", "/en/a/b", "/de"]) {
    const response = await get(base, unknown);
    check(`GET ${unknown} returns 404`, response.status === 404, `status ${response.status}`);
  }
}

async function main() {
  if (!existsSync(path.join(projectRoot, ".next", "BUILD_ID"))) {
    console.error("No production build found. Run `npm run build` before the smoke test.");
    process.exit(1);
  }

  const port = await findFreePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );

  let serverLog = "";
  server.stdout.on("data", (chunk) => (serverLog += chunk));
  server.stderr.on("data", (chunk) => (serverLog += chunk));

  let exitCode = 0;
  try {
    await waitUntilReady(base, server);
    await runChecks(base);
  } catch (error) {
    exitCode = 1;
    check("smoke run completed", false, error instanceof Error ? error.message : String(error));
  } finally {
    await stopServer(server);
  }

  const failed = results.filter((result) => !result.passed);
  for (const result of results) {
    const mark = result.passed ? "PASS" : "FAIL";
    const detail = !result.passed && result.detail ? `  (${result.detail})` : "";
    console.log(`${mark}  ${result.name}${detail}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} smoke checks passed.`);

  if (failed.length > 0 || exitCode !== 0) {
    console.error("\nServer output:\n" + serverLog.slice(-4000));
    process.exit(1);
  }
}

await main();
