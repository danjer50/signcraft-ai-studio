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

async function get(base, pathname, headers = {}) {
  const response = await fetch(new URL(pathname, base), {
    redirect: "manual",
    headers,
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

const arabicScript = /[\u0600-\u06FF]/;

/**
 * Unknown URLs. Each one must return 404 with a complete document in the language its URL
 * implies. An unknown locale such as /de falls back to French, the default locale.
 * `englishHref` is where the language switcher should point for English.
 */
const unknownPages = [
  { path: "/fr/does-not-exist", lang: "fr", dir: "ltr", englishHref: "/en/does-not-exist" },
  { path: "/en/a/b", lang: "en", dir: "ltr", englishHref: "/en/a/b" },
  { path: "/ar/x", lang: "ar", dir: "rtl", englishHref: "/en/x" },
  { path: "/de", lang: "fr", dir: "ltr", englishHref: null },
  { path: "/de/x/y", lang: "fr", dir: "ltr", englishHref: null },
  { path: "/nope", lang: "fr", dir: "ltr", englishHref: null },
  { path: "/FR", lang: "fr", dir: "ltr", englishHref: null },
  { path: "/fr/projects", lang: "fr", dir: "ltr", englishHref: "/en/projects" },
];

/** The href of the first anchor with the given hreflang, or null. Attribute order is not assumed. */
function anchorHref(html, hreflang) {
  for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
    // Attribute names are case-insensitive in HTML, and React writes this one as hrefLang.
    if (new RegExp(`\\bhreflang="${hreflang}"`, "i").test(tag)) {
      return tag.match(/\bhref="([^"]*)"/)?.[1] ?? null;
    }
  }
  return null;
}

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
    // Prerendered at build time, so the response is cached as static output.
    check(
      `/${locale} is statically prerendered`,
      (page.headers.get("x-nextjs-prerender") ?? "")
        .split(",")
        .map((v) => v.trim())
        .includes("1") && (page.headers.get("cache-control") ?? "").includes("s-maxage"),
      `prerender ${page.headers.get("x-nextjs-prerender")}, cache-control ${page.headers.get("cache-control")}`,
    );
  }

  const arabicHeading = h1Text((await get(base, "/ar")).body);
  check(
    "/ar heading is written in Arabic script",
    /[\u0600-\u06FF]/.test(arabicHeading),
    arabicHeading,
  );

  // Product surface: the landing page calls to action and the two real product routes.
  const productPages = [
    {
      path: "create",
      headings: { fr: "Créer mon enseigne", en: "Create my sign", ar: "أنشئ لافتتي" },
      demoMarker: 'data-template="channelLetters"',
      // The template catalogue ships with the page: picker legend, default template
      // name and the default template's colour names are all in the prerendered HTML.
      catalogueMarkers: {
        fr: [
          "Modèle",
          "Lettres lumineuses",
          "Couleurs",
          "Blanc chaud",
          "La photo de votre devanture",
          "Téléverser une photo",
        ],
        en: [
          "Template",
          "Illuminated letters",
          "Colours",
          "Warm white",
          "Your storefront photo",
          "Upload a photo",
        ],
        ar: ["القالب", "حروف مضيئة", "الألوان", "أبيض دافئ", "صورة واجهة محلك", "رفع صورة"],
      },
      // The customer flow is the only place a file input exists.
      fileInput: true,
      plannedLabels: { fr: "Prévu", en: "Planned", ar: "مخطط" },
    },
    {
      path: "pro",
      headings: {
        fr: "Espace professionnel",
        en: "Professional workspace",
        ar: "مساحة العمل الاحترافية",
      },
      demoMarker: null,
      catalogueMarkers: null,
      fileInput: false,
      plannedLabels: { fr: "Prévu", en: "Planned", ar: "مخطط" },
    },
  ];
  for (const { locale } of localePages) {
    const home = await get(base, `/${locale}`);
    check(`/${locale} links to /${locale}/create`, home.body.includes(`href="/${locale}/create"`));
    check(`/${locale} links to /${locale}/pro`, home.body.includes(`href="/${locale}/pro"`));
    check(`/${locale} links to the example gallery`, home.body.includes('href="#examples"'));
  }
  for (const { locale } of localePages) {
    for (const page of productPages) {
      const response = await get(base, `/${locale}/${page.path}`);
      const heading = h1Text(response.body);
      const prerendered = (response.headers.get("x-nextjs-prerender") ?? "")
        .split(",")
        .map((v) => v.trim())
        .includes("1");
      check(
        `/${locale}/${page.path} renders the product heading`,
        response.status === 200 && heading === page.headings[locale],
        `status ${response.status}, h1 ${heading || "<none>"}`,
      );
      check(`/${locale}/${page.path} is statically prerendered`, prerendered);
      if (page.demoMarker) {
        check(
          `/${locale}/${page.path} includes the live template demo`,
          response.body.includes(page.demoMarker),
        );
      }
      for (const marker of page.catalogueMarkers?.[locale] ?? []) {
        check(
          `/${locale}/${page.path} ships catalogue copy "${marker}"`,
          response.body.includes(marker),
        );
      }
      check(
        `/${locale}/${page.path} ${page.fileInput ? "offers" : "does not offer"} a photo file input`,
        response.body.includes('type="file"') === page.fileInput,
      );
      check(
        `/${locale}/${page.path} labels planned capabilities`,
        response.body.includes(page.plannedLabels[locale]),
      );
    }
  }

  // The proxy sets the display locale itself, so a locale header sent by the client is ignored.
  for (const { path: unknown, header, expected } of [
    { path: "/fr/does-not-exist", header: "en", expected: "fr" },
    { path: "/de", header: "ar", expected: "fr" },
  ]) {
    const response = await get(base, unknown, { "x-signcraft-locale": header });
    const htmlTag = response.body.match(/<html\b[^>]*>/i)?.[0] ?? "";
    check(
      `GET ${unknown} ignores a client-sent x-signcraft-locale: ${header}`,
      response.status === 404 && new RegExp(`\\blang="${expected}"`).test(htmlTag),
      `status ${response.status}, ${htmlTag || "no <html> tag"}`,
    );
  }

  for (const { path: unknown, lang, dir, englishHref } of unknownPages) {
    const response = await get(base, unknown);
    const htmlTag = response.body.match(/<html\b[^>]*>/i)?.[0] ?? "";
    const heading = h1Text(response.body);
    const headingCount = (response.body.match(/<h1\b/gi) ?? []).length;

    check(`GET ${unknown} returns 404`, response.status === 404, `status ${response.status}`);
    check(
      `GET ${unknown} sets lang="${lang}" and dir="${dir}" on <html>`,
      new RegExp(`\\blang="${lang}"`).test(htmlTag) && new RegExp(`\\bdir="${dir}"`).test(htmlTag),
      htmlTag || "no <html> tag",
    );
    check(
      `GET ${unknown} is marked noindex`,
      /<meta name="robots" content="noindex"\/?>/.test(response.body),
    );
    check(
      `GET ${unknown} has one non-empty <h1> in ${lang}`,
      headingCount === 1 &&
        heading !== "" &&
        (lang === "ar" ? arabicScript.test(heading) : !arabicScript.test(heading)),
      `${headingCount} heading(s): ${heading}`,
    );
    if (englishHref !== null) {
      check(
        `GET ${unknown} keeps the same path in the English switcher link`,
        anchorHref(response.body, "en") === englishHref,
        `href ${anchorHref(response.body, "en")}`,
      );
    }
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
