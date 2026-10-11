import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, trackUnexpectedErrors } from "./helpers";

const locales = ["fr", "en", "ar"] as const;

const headings = {
  fr: {
    home: "VOTRE IDÉE. NOTRE IA. VOTRE ENSEIGNE PARFAITE.",
    create: "Créer mon enseigne",
  },
  en: {
    home: "YOUR IDEA. OUR AI. YOUR PERFECT SIGN.",
    create: "Create my sign",
  },
  ar: {
    home: "فكرتك. ذكاؤنا الاصطناعي. لافتتك المثالية.",
    create: "أنشئ لافتتي",
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
      // Stage D: the Pro workspace is never advertised on public pages.
      await expect(page.locator(`main a[href="/${locale}/pro"]`)).toHaveCount(0);
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

      // The demo is genuinely interactive: typing updates the preview. The main
      // preview is marked explicitly because the gallery cards render mini previews.
      const textInput = page.getByRole("textbox").first();
      await textInput.fill("Éclat");
      const preview = page.locator('div[data-template][data-preview-role="main"]');
      await expect(preview.locator('p[class*="signText"]')).toHaveText("Éclat");

      // The preview starts on the default template and shows its name.
      await expect(preview).toHaveAttribute("data-template", "channelLetters");
      await expect(preview.getByText(templateNames[locale].channel)).toBeVisible();

      // Choosing a template updates the preview and its name instantly. Matches are
      // anchored because a radio's accessible name also contains its hint, and hints
      // can mention other template names.
      await page.getByRole("radio", { name: new RegExp(templateNames[locale].neon) }).check();
      await expect(preview).toHaveAttribute("data-template", "neonScript");
      await expect(preview).toHaveAttribute("data-layout", "neon");
      await expect(preview.getByText(templateNames[locale].neon)).toBeVisible();

      // Back to the default template: choosing a colour updates the preview instantly.
      await page.getByRole("radio", { name: new RegExp(templateNames[locale].channel) }).check();
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
    test(`the ${locale} pro page redirects anonymous visitors to the login`, async ({ page }) => {
      const unexpected = trackUnexpectedErrors(page);

      // Stage D: hiding the menu entry is not security — the route itself is gated.
      await page.goto(`/${locale}/pro`);
      await page.waitForURL(`/${locale}/login`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/login$`));
      // The access-code entry is the customer-facing door to the Pro workspace.
      await expect(page.getByTestId("access-code-form")).toBeVisible();

      expect(unexpected).toEqual([]);
    });
  }

  test("the Arabic product pages keep RTL", async ({ page }) => {
    for (const path of ["/ar", "/ar/create", "/ar/login"]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    }
  });
});
