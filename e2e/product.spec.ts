import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, trackUnexpectedErrors } from "./helpers";

const locales = ["fr", "en", "ar"] as const;

const headings = {
  fr: {
    home: "VOTRE IDÉE. NOTRE IA. VOTRE ENSEIGNE PARFAITE.",
    create: "Créer mon enseigne",
    pro: "Espace professionnel",
  },
  en: {
    home: "YOUR IDEA. OUR AI. YOUR PERFECT SIGN.",
    create: "Create my sign",
    pro: "Professional workspace",
  },
  ar: {
    home: "فكرتك. ذكاؤنا الاصطناعي. لافتتك المثالية.",
    create: "أنشئ لافتتي",
    pro: "مساحة العمل الاحترافية",
  },
} as const;

const templateNames = {
  fr: { channel: "Lettres lumineuses", neon: "Éclat néon" },
  en: { channel: "Illuminated letters", neon: "Neon glow" },
  ar: { channel: "حروف مضيئة", neon: "وهج النيون" },
} as const;

/** Colour names unique to one slot of the default template (channelLetters). */
const colourNames = {
  fr: { face: "Glace", glow: "Émeraude" },
  en: { face: "Ice", glow: "Emerald" },
  ar: { face: "أبيض مثلجي", glow: "زمردي" },
} as const;

test.describe("product surface", () => {
  test("the landing page leads with the product and real calls to action", async ({ page }) => {
    const unexpected = trackUnexpectedErrors(page);

    for (const locale of locales) {
      await page.goto(`/${locale}`);
      await expect(
        page.getByRole("heading", { level: 1, name: headings[locale].home }),
      ).toBeVisible();
      await expect(page.locator(`main a[href="/${locale}/create"]`).first()).toBeVisible();
      await expect(page.locator(`main a[href="/${locale}/pro"]`).first()).toBeVisible();
      await expect(page.locator('main a[href="#examples"]').first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    expect(unexpected).toEqual([]);
  });

  for (const locale of locales) {
    test(`the ${locale} create page runs the live template demo`, async ({ page }) => {
      const unexpected = trackUnexpectedErrors(page);

      await page.goto(`/${locale}/create`);
      await expect(
        page.getByRole("heading", { level: 1, name: headings[locale].create }),
      ).toBeVisible();

      // The demo is genuinely interactive: typing updates the preview.
      const textInput = page.getByRole("textbox").first();
      await textInput.fill("Éclat");
      await expect(page.locator('p[class*="signText"]')).toHaveText("Éclat");

      // The preview starts on the default template and shows its name.
      const preview = page.locator("div[data-template]");
      await expect(preview).toHaveAttribute("data-template", "channelLetters");
      await expect(preview.getByText(templateNames[locale].channel)).toBeVisible();

      // Choosing a template updates the preview and its name instantly. Matches are
      // anchored because a radio's accessible name also contains its hint, and hints
      // can mention other template names.
      await page.getByRole("radio", { name: new RegExp(`^${templateNames[locale].neon}`) }).check();
      await expect(preview).toHaveAttribute("data-template", "neonScript");
      await expect(preview).toHaveAttribute("data-layout", "neon");
      await expect(preview.getByText(templateNames[locale].neon)).toBeVisible();

      // Back to the default template: choosing a colour updates the preview instantly.
      await page
        .getByRole("radio", { name: new RegExp(`^${templateNames[locale].channel}`) })
        .check();
      await expect(preview).toHaveAttribute("data-template", "channelLetters");
      await expect(preview.getByText(templateNames[locale].channel)).toBeVisible();

      const faceColour = () =>
        preview.evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--sign-face"),
        );
      await expect.poll(faceColour).toBe("#fdeecf");
      await page.getByRole("radio", { name: colourNames[locale].face, exact: true }).check();
      await expect.poll(faceColour).toBe("#dff4ff");

      const glowColour = () =>
        preview.evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--sign-glow"),
        );
      await expect.poll(glowColour).toBe("#7dd3fc");
      await page.getByRole("radio", { name: colourNames[locale].glow, exact: true }).check();
      await expect.poll(glowColour).toBe("#34d399");

      // The limitations of the demonstration are stated on the page.
      await expect(
        page
          .getByText(/not an AI-generated design/i)
          .or(page.getByText(/ni d'une création générée par IA/i))
          .or(page.getByText(/ليست تصميمًا مولّدًا/i)),
      ).toBeVisible();

      await expectNoHorizontalOverflow(page);
      expect(unexpected).toEqual([]);
    });
  }

  for (const locale of locales) {
    test(`the ${locale} pro page is an honest entry point with no fake editor`, async ({
      page,
    }) => {
      const unexpected = trackUnexpectedErrors(page);

      await page.goto(`/${locale}/pro`);
      await expect(
        page.getByRole("heading", { level: 1, name: headings[locale].pro }),
      ).toBeVisible();

      // Five planned tools, each labelled; no controls that would imply an editor exists.
      await expect(page.locator("article")).toHaveCount(5);
      await expect(page.locator("main").getByRole("button")).toHaveCount(0);
      await expect(page.locator("main").getByRole("textbox")).toHaveCount(0);

      await expectNoHorizontalOverflow(page);
      expect(unexpected).toEqual([]);
    });
  }

  test("the Arabic product pages keep RTL", async ({ page }) => {
    for (const path of ["/ar", "/ar/create", "/ar/pro"]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    }
  });
});
