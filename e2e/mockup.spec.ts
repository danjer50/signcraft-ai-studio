import { expect, test, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow, trackUnexpectedErrors } from "./helpers";

const locales = ["fr", "en", "ar"] as const;

const copy = {
  fr: {
    title: "Maquette visuelle",
    generateCta: "Générer l'aperçu de la maquette",
    regenerateCta: "Mettre à jour la maquette",
    downloadCta: "Télécharger le PNG",
    mockupAlt: "Maquette visuelle simple de votre enseigne sur la photo de votre devanture",
    honesty: /sans correction de perspective/,
    disabledNoPhoto: "Téléversez d'abord une photo de votre devanture.",
    disabledNoSelection: "Marquez d'abord la zone de l'enseigne sur la photo.",
    photoAlt: "Photo de votre devanture",
    stageGroup: /Zone de positionnement de l'enseigne/,
  },
  en: {
    title: "Visual mockup",
    generateCta: "Generate mockup preview",
    regenerateCta: "Update the mockup",
    downloadCta: "Download PNG",
    mockupAlt: "Basic visual mockup of your sign on your storefront photo",
    honesty: /without perspective correction/,
    disabledNoPhoto: "Upload a photo of your storefront first.",
    disabledNoSelection: "Mark the sign area on the photo first.",
    photoAlt: "Photo of your storefront",
    stageGroup: /Sign placement area/,
  },
  ar: {
    title: "نموذج بصري",
    generateCta: "إنشاء معاينة النموذج",
    regenerateCta: "تحديث النموذج",
    downloadCta: "تنزيل PNG",
    mockupAlt: "نموذج بصري بسيط للافتتك على صورة واجهة محلك",
    honesty: /دون تصحيح المنظور/,
    disabledNoPhoto: "ارفع أولًا صورة لواجهة محلك.",
    disabledNoSelection: "حدد أولًا منطقة اللافتة على الصورة.",
    photoAlt: "صورة واجهة محلك",
    stageGroup: /منطقة موضع اللافتة/,
  },
} as const;

// Downloads must be accepted for the PNG export assertion.
test.use({ acceptDownloads: true });

/** Generates a real 800×600 PNG inside the page and returns its bytes. */
async function makeStorefrontPng(page: Page): Promise<Buffer> {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("no 2d context");
    }
    const sky = context.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, "#1c2733");
    sky.addColorStop(1, "#0b0f14");
    context.fillStyle = sky;
    context.fillRect(0, 0, 800, 600);
    context.fillStyle = "#222c36";
    context.fillRect(100, 200, 600, 400);
    context.fillStyle = "#2dd4bf";
    context.fillRect(150, 250, 200, 80);
    context.fillStyle = "#fbbf24";
    context.fillRect(450, 250, 200, 80);
    return canvas.toDataURL("image/png").split(",")[1] ?? "";
  });
  return Buffer.from(base64, "base64");
}

/** Tracks requests that would send data to another origin. blob:/data: are local. */
function trackForeignRequests(page: Page, origin: string): string[] {
  const foreign: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return;
    }
    if (!url.startsWith(origin)) {
      foreign.push(url);
    }
  });
  return foreign;
}

/** Uploads a real photo through the file input and waits for it to display. */
async function uploadPhoto(
  page: Page,
  texts: (typeof copy)[(typeof locales)[number]],
): Promise<void> {
  const png = await makeStorefrontPng(page);
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "storefront.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("img", { name: texts.photoAlt })).toBeVisible();
}

test.describe("visual mockup", () => {
  for (const locale of locales) {
    test(`the ${locale} create page renders a labelled flat mockup and downloads it as PNG`, async ({
      page,
    }) => {
      const unexpected = trackUnexpectedErrors(page);
      const texts = copy[locale];

      await page.goto(`/${locale}/create`);
      const origin = new URL(page.url()).origin;
      const foreign = trackForeignRequests(page, origin);

      const panel = page.locator("[data-mockup-panel]");
      await expect(panel.getByRole("heading", { name: texts.title })).toBeVisible();

      // Disabled states with explanations — never a dead control.
      const generate = panel.getByRole("button", { name: texts.generateCta });
      await expect(generate).toBeDisabled();
      await expect(panel.getByText(texts.disabledNoPhoto)).toBeVisible();
      // The download action stays disabled until a mockup exists.
      await expect(panel.getByRole("button", { name: texts.downloadCta })).toBeDisabled();

      // Upload a photo: the button explains that the selection is missing next.
      await uploadPhoto(page, texts);
      await expect(generate).toBeDisabled();
      await expect(panel.getByText(texts.disabledNoSelection)).toBeVisible();

      // Mark the area with the keyboard on the stage's single tab stop.
      const stage = page.locator("[data-photo-stage]");
      await page.waitForFunction(() => {
        const img = document.querySelector("[data-photo-stage] img");
        return img instanceof HTMLImageElement && img.naturalWidth > 0;
      });
      await stage.scrollIntoViewIfNeeded();
      await page.getByRole("group", { name: texts.stageGroup }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("[data-selection]")).toBeAttached();

      // Generate: the mockup appears, labelled honestly.
      await expect(generate).toBeEnabled();
      await generate.click();
      const mockup = panel.getByRole("img", { name: texts.mockupAlt });
      await expect(mockup).toBeVisible();
      await expect(panel.getByText(texts.honesty)).toBeVisible();
      // After a successful render the action becomes "Update the mockup".
      await expect(panel.getByRole("button", { name: texts.regenerateCta })).toBeVisible();
      await expect(panel.getByRole("button", { name: texts.downloadCta })).toBeEnabled();

      // The mockup image is a real render: it has intrinsic dimensions.
      const natural = await page.evaluate(
        (element) => {
          const img = element as HTMLImageElement;
          return { width: img.naturalWidth, height: img.naturalHeight };
        },
        await panel.getByRole("img", { name: texts.mockupAlt }).elementHandle(),
      );
      expect(natural.width).toBe(800);
      expect(natural.height).toBe(600);

      // Download: a valid PNG named signcraft-mockup.png.
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        panel.getByRole("button", { name: texts.downloadCta }).click(),
      ]);
      expect(download.suggestedFilename()).toBe("signcraft-mockup.png");
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      const bytes = Buffer.concat(chunks);
      expect(bytes.length).toBeGreaterThan(1000);
      // PNG magic bytes.
      expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

      // Updating after a change keeps working (throttled, user-initiated).
      await panel.getByRole("button", { name: texts.regenerateCta }).click();
      await expect(panel.getByRole("img", { name: texts.mockupAlt })).toBeVisible();

      // Nothing left the browser.
      expect(foreign).toEqual([]);

      await expectNoHorizontalOverflow(page);
      expect(unexpected).toEqual([]);
    });
  }

  test("the mockup panel localises in Arabic with correct RTL", async ({ page }) => {
    const unexpected = trackUnexpectedErrors(page);
    await page.goto("/ar/create");
    expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
    const panel = page.locator("[data-mockup-panel]");
    await expect(panel.getByRole("heading", { name: copy.ar.title })).toBeVisible();
    await expect(panel.getByRole("button", { name: copy.ar.generateCta })).toBeVisible();
    await expect(panel.getByText(copy.ar.disabledNoPhoto)).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(unexpected).toEqual([]);
  });
});
