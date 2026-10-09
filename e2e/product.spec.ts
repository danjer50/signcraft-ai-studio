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
    test(`the ${locale} create page runs the live style demo`, async ({ page }) => {
      const unexpected = trackUnexpectedErrors(page);

      await page.goto(`/${locale}/create`);
      await expect(
        page.getByRole("heading", { level: 1, name: headings[locale].create }),
      ).toBeVisible();

      // The demo is genuinely interactive: typing updates the preview.
      const textInput = page.getByRole("textbox").first();
      await textInput.fill("Éclat");
      await expect(page.locator('p[class*="signText"]')).toHaveText("Éclat");

      // Choosing a visual direction changes the preview composition.
      const preview = page.locator("div[data-style]");
      await expect(preview).toHaveAttribute("data-style", "channel");
      await page.getByRole("radio").first().check();
      await expect(preview).toHaveAttribute("data-style", "neon");

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
