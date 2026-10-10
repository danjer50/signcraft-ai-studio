#!/usr/bin/env node
/**
 * Smoke test for the production build.
 *
 * The app is a static export (`output: "export"`) served by Cloudflare Pages, with the
 * auth API as Pages Functions. The smoke test therefore starts `npm run test:server`
 * (wrangler pages dev over `out/`, with a fresh local D1 seeded from
 * e2e/fixtures/seed.sql), requests the important routes, checks the HTML, the HTTP
 * behaviour and the auth API, then stops the server. Run `npm run build` first.
 * Requires a POSIX system (uses process groups to stop the server).
 */
import { spawn } from "node:child_process";
import { pbkdf2Sync } from "node:crypto";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STARTUP_TIMEOUT_MS = 90_000;
const REQUEST_TIMEOUT_MS = 15_000;

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

async function postJson(base, pathname, body, headers = {}) {
  const response = await fetch(new URL(pathname, base), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

function setCookieOf(headers) {
  const cookies = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  return cookies[0] ?? headers.get("set-cookie") ?? "";
}

async function waitUntilReady(base, server) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`test server exited early with code ${server.exitCode}`);
    }
    try {
      await get(base, "/fr");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`test server did not respond within ${STARTUP_TIMEOUT_MS} ms`);
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
      // Negative pid signals the whole process group, including wrangler's workerd.
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
 * Unknown URLs. Each one must return 404. Static hosting serves one exported 404.html
 * for all of them, so the per-locale language checks live in the browser tests
 * (e2e/not-found.spec.ts); here the document-level contract is checked once.
 */
const unknownPaths = [
  "/fr/does-not-exist",
  "/en/a/b",
  "/ar/x",
  "/de",
  "/de/x/y",
  "/nope",
  "/FR",
  "/fr/projects",
];

/** The static export is the prerender: these files must exist after `next build`. */
const expectedStaticFiles = [
  "fr.html",
  "en.html",
  "ar.html",
  "fr/create.html",
  "en/create.html",
  "ar/create.html",
  "fr/pro.html",
  "en/pro.html",
  "ar/pro.html",
  "fr/login.html",
  "en/login.html",
  "ar/login.html",
  "fr/admin.html",
  "fr/studio.html",
  "fr/setup.html",
  "fr/set-password.html",
  "404.html",
  "not-found-locale.js",
  "_headers",
  "_redirects",
  "_routes.json",
];

// Test-only values, matching scripts/test-env.mjs and e2e/fixtures/seed.sql.
const TEST_SETUP_SECRET = "test-only-setup-secret-0f1e2d3c";
const SEED_ADMIN_EMAIL = "admin@studio.test";
const SEED_ADMIN_PASSWORD = "StudioTest!Passw0rd";
const SEED_ADMIN_SALT = "a1b2c3d4e5f60718293a4b5c6d7e8f90";

function clientHashFor(password, saltHex) {
  return pbkdf2Sync(
    Buffer.from(password.normalize("NFKC"), "utf8"),
    Buffer.from(saltHex, "hex"),
    600_000,
    32,
    "sha256",
  ).toString("base64url");
}

async function runChecks(base) {
  // Root redirects to the default locale (public/_redirects on Pages).
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
    check(
      `/${locale} sends Referrer-Policy`,
      page.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
    );
    check(`/${locale} does not expose X-Powered-By`, !page.headers.has("x-powered-by"));
    // The export is fully static: the prerendered file must exist in out/.
    check(
      `/${locale} is a static export file (${locale}.html)`,
      existsSync(path.join(projectRoot, "out", `${locale}.html`)),
    );
  }

  const arabicHeading = h1Text((await get(base, "/ar")).body);
  check("/ar heading is written in Arabic script", arabicScript.test(arabicHeading), arabicHeading);

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
          "Maquette visuelle",
          "Générer l'aperçu de la maquette",
          "sans correction de perspective",
        ],
        en: [
          "Template",
          "Illuminated letters",
          "Colours",
          "Warm white",
          "Your storefront photo",
          "Upload a photo",
          "Visual mockup",
          "Generate mockup preview",
          "without perspective correction",
        ],
        ar: [
          "القالب",
          "حروف مضيئة",
          "الألوان",
          "أبيض دافئ",
          "صورة واجهة محلك",
          "رفع صورة",
          "نموذج بصري",
          "إنشاء معاينة النموذج",
          "دون تصحيح المنظور",
        ],
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
      check(
        `/${locale}/${page.path} renders the product heading`,
        response.status === 200 && heading === page.headings[locale],
        `status ${response.status}, h1 ${heading || "<none>"}`,
      );
      check(
        `/${locale}/${page.path} is a static export file`,
        existsSync(path.join(projectRoot, "out", locale, `${page.path}.html`)),
      );
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

  // Nothing reads a client-sent locale header any more (the old proxy is gone): the
  // rendered language always follows the URL.
  for (const { path: requested, header, expected } of [
    { path: "/fr", header: "ar", expected: "fr" },
    { path: "/en", header: "fr", expected: "en" },
  ]) {
    const response = await get(base, requested, { "x-signcraft-locale": header });
    const htmlTag = response.body.match(/<html\b[^>]*>/i)?.[0] ?? "";
    check(
      `GET ${requested} ignores a client-sent x-signcraft-locale: ${header}`,
      response.status === 200 && new RegExp(`\\blang="${expected}"`).test(htmlTag),
      `status ${response.status}, ${htmlTag || "no <html> tag"}`,
    );
  }

  // The exported 404 document: one file, three locale variants, detection script.
  for (const unknown of unknownPaths) {
    const response = await get(base, unknown);
    check(`GET ${unknown} returns 404`, response.status === 404, `status ${response.status}`);
  }
  const notFound = await get(base, "/fr/does-not-exist");
  const nfHtmlTag = notFound.body.match(/<html\b[^>]*>/i)?.[0] ?? "";
  check(
    "the 404 document renders in the default locale at build time",
    /\blang="fr"/.test(nfHtmlTag) && /\bdir="ltr"/.test(nfHtmlTag),
    nfHtmlTag || "no <html> tag",
  );
  check(
    "the 404 document embeds all three locale variants",
    ['data-notfound-locale="fr"', 'data-notfound-locale="en"', 'data-notfound-locale="ar"'].every(
      (marker) => notFound.body.includes(marker),
    ),
  );
  const variantTag = (locale) =>
    notFound.body.match(new RegExp(`<div[^>]*data-notfound-locale="${locale}"[^>]*>`))?.[0] ?? "";
  check(
    "the 404 document shows the default variant and hides the other two",
    !variantTag("fr").includes("hidden") &&
      variantTag("en").includes('hidden=""') &&
      variantTag("ar").includes('hidden=""'),
    `fr: ${variantTag("fr").slice(0, 80)}`,
  );
  check(
    "the 404 document carries a per-locale title for each variant",
    (notFound.body.match(/data-notfound-title=/g) ?? []).length === 3,
  );
  check(
    "the 404 document loads the locale-detection script",
    notFound.body.includes('<script src="/not-found-locale.js"'),
  );
  check(
    "the 404 document is marked noindex (exactly once)",
    (notFound.body.match(/<meta name="robots" content="noindex"\/?>/g) ?? []).length === 1,
  );
  check(
    "the 404 document sends nosniff",
    notFound.headers.get("x-content-type-options") === "nosniff",
  );

  // The auth API (Pages Functions + local D1 seeded with one admin).
  const meAnonymous = await get(base, "/api/auth/me");
  check(
    "GET /api/auth/me answers 200 unauthenticated and is never cached",
    meAnonymous.status === 200 &&
      meAnonymous.body.includes('"authenticated":false') &&
      meAnonymous.headers.get("cache-control") === "no-store",
    `status ${meAnonymous.status}`,
  );
  check(
    "GET /api/auth/me sends nosniff",
    meAnonymous.headers.get("x-content-type-options") === "nosniff",
  );

  const setupWrong = await postJson(base, "/api/auth/setup", { setupSecret: "wrong" });
  check("POST /api/auth/setup rejects a wrong secret (401)", setupWrong.status === 401);

  const setupSalt = await postJson(base, "/api/auth/setup", { setupSecret: TEST_SETUP_SECRET });
  check(
    "POST /api/auth/setup hands out a salt with the right secret (200)",
    setupSalt.status === 200 && /"salt":"[0-9a-f]{32}"/.test(setupSalt.body),
    `status ${setupSalt.status}`,
  );
  const setupAgain = await postJson(base, "/api/auth/setup", {
    setupSecret: TEST_SETUP_SECRET,
    email: "second@studio.test",
    salt: SEED_ADMIN_SALT,
    clientHash: clientHashFor("another-password-123", SEED_ADMIN_SALT),
  });
  check(
    "POST /api/auth/setup refuses a second admin (409, seed already has one)",
    setupAgain.status === 409 && setupAgain.body.includes("admin_already_exists"),
    `status ${setupAgain.status}`,
  );

  const prelogin = await postJson(base, "/api/auth/prelogin", { email: SEED_ADMIN_EMAIL });
  check(
    "POST /api/auth/prelogin returns the seeded admin's salt",
    prelogin.status === 200 && prelogin.body.includes(SEED_ADMIN_SALT),
    `status ${prelogin.status}`,
  );

  const badLogin = await postJson(base, "/api/auth/login", {
    email: SEED_ADMIN_EMAIL,
    clientHash: clientHashFor("wrong-password-999", SEED_ADMIN_SALT),
  });
  check("POST /api/auth/login rejects a wrong password (401)", badLogin.status === 401);

  const login = await postJson(base, "/api/auth/login", {
    email: SEED_ADMIN_EMAIL,
    clientHash: clientHashFor(SEED_ADMIN_PASSWORD, SEED_ADMIN_SALT),
  });
  const loginCookie = setCookieOf(login.headers);
  check(
    "POST /api/auth/login accepts the seeded admin and sets a __Host- session cookie",
    login.status === 200 &&
      login.body.includes('"role":"admin"') &&
      loginCookie.includes("__Host-sc_session=") &&
      loginCookie.includes("HttpOnly") &&
      loginCookie.includes("Secure") &&
      loginCookie.includes("SameSite=Lax"),
    `status ${login.status}, cookie ${loginCookie.slice(0, 60)}`,
  );

  const sessionId = loginCookie.match(/__Host-sc_session=([^;]+)/)?.[1] ?? "";
  const cookieHeader = { cookie: `__Host-sc_session=${sessionId}` };

  const meAuthed = await get(base, "/api/auth/me", cookieHeader);
  check(
    "GET /api/auth/me with the session cookie is authenticated as admin",
    meAuthed.status === 200 &&
      meAuthed.body.includes('"authenticated":true') &&
      meAuthed.body.includes('"role":"admin"'),
    `status ${meAuthed.status}`,
  );

  const accountsAnon = await get(base, "/api/auth/accounts");
  check("GET /api/auth/accounts without a session is refused (401)", accountsAnon.status === 401);

  const accounts = await get(base, "/api/auth/accounts", cookieHeader);
  check(
    "GET /api/auth/accounts lists the seeded admin for the admin session",
    accounts.status === 200 && accounts.body.includes(SEED_ADMIN_EMAIL),
    `status ${accounts.status}`,
  );

  const logout = await postJson(base, "/api/auth/logout", {}, cookieHeader);
  check(
    "POST /api/auth/logout clears the session cookie",
    logout.status === 200 && setCookieOf(logout.headers).includes("__Host-sc_session=;"),
    `status ${logout.status}`,
  );
  const meAfterLogout = await get(base, "/api/auth/me", cookieHeader);
  check(
    "GET /api/auth/me after logout is unauthenticated (session deleted server-side)",
    meAfterLogout.body.includes('"authenticated":false'),
  );

  // The new auth pages are real, exported routes.
  for (const page of ["login", "admin", "studio", "setup", "set-password"]) {
    const response = await get(base, `/fr/${page}`);
    check(
      `GET /fr/${page} returns 200 (exported auth route)`,
      response.status === 200 && existsSync(path.join(projectRoot, "out", "fr", `${page}.html`)),
      `status ${response.status}`,
    );
  }
}

async function main() {
  const missing = expectedStaticFiles.filter(
    (file) => !existsSync(path.join(projectRoot, "out", file)),
  );
  if (missing.length > 0) {
    console.error(
      `No complete static export found in out/ (missing: ${missing.join(", ")}). Run \`npm run build\` first.`,
    );
    process.exit(1);
  }

  const port = await findFreePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn("npm", ["run", "test:server"], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, PORT: String(port) },
  });

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
