import { expect, test, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow, trackUnexpectedErrors } from "./helpers";

const locales = ["fr", "en", "ar"] as const;

const copy = {
  fr: {
    photoAlt: "Photo de votre devanture",
    schematic: /positionnement schématique/,
    clearCta: "Effacer la sélection",
    redrawCta: "Retracer la sélection",
    defaultCta: "Marquer une zone par défaut",
    typeError: /pas une photo prise en charge/,
    stageGroup: /Zone de positionnement de l'enseigne/,
  },
  en: {
    photoAlt: "Photo of your storefront",
    schematic: /schematic placement/,
    clearCta: "Clear selection",
    redrawCta: "Redraw selection",
    defaultCta: "Mark a default area",
    typeError: /not a supported photo/,
    stageGroup: /Sign placement area/,
  },
  ar: {
    photoAlt: "صورة واجهة محلك",
    schematic: /موضع توضيحي/,
    clearCta: "مسح التحديد",
    redrawCta: "إعادة رسم التحديد",
    defaultCta: "تحديد منطقة افتراضية",
    typeError: /ليس صورة مدعومة/,
    stageGroup: /منطقة موضع اللافتة/,
  },
} as const;

/**
 * Generates a real 800×600 PNG inside the page with a canvas and returns its bytes.
 * A browser-encoded image is guaranteed valid, unlike a hand-built fixture.
 */
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

test.describe("storefront photo and sign area", () => {
  for (const locale of locales) {
    test(`the ${locale} create page accepts a photo, marks an adjustable area, and never uploads`, async ({
      page,
    }) => {
      const unexpected = trackUnexpectedErrors(page);
      const texts = copy[locale];

      await page.goto(`/${locale}/create`);
      const origin = new URL(page.url()).origin;
      const foreign = trackForeignRequests(page, origin);

      // Upload a real photo through the file input.
      const png = await makeStorefrontPng(page);
      await page
        .locator('input[type="file"]')
        .setInputFiles({ name: "storefront.png", mimeType: "image/png", buffer: png });

      const photo = page.getByRole("img", { name: texts.photoAlt });
      await expect(photo).toBeVisible();
      await expect(page.getByText(/storefront\.png/)).toBeVisible();

      // Draw a selection by dragging on the photo. The raw mouse API does not
      // scroll, so bring the stage into view first, and wait for the image to
      // have its natural size (the stage height depends on it).
      const stage = page.locator("[data-photo-stage]");
      await page.waitForFunction(() => {
        const img = document.querySelector("[data-photo-stage] img");
        return img instanceof HTMLImageElement && img.naturalWidth > 0;
      });
      await stage.scrollIntoViewIfNeeded();
      const box = await stage.boundingBox();
      expect(box).not.toBeNull();
      const { x, y, width, height } = box!;
      await page.mouse.move(x + width * 0.1, y + height * 0.1);
      await page.mouse.down();
      await page.mouse.move(x + width * 0.6, y + height * 0.6, { steps: 8 });
      await page.mouse.up();

      const selection = page.locator("[data-selection]");
      await expect(selection).toBeAttached();
      const drawn = {
        x: Number(await selection.getAttribute("data-x")),
        y: Number(await selection.getAttribute("data-y")),
        width: Number(await selection.getAttribute("data-width")),
        height: Number(await selection.getAttribute("data-height")),
      };
      expect(drawn.x).toBeCloseTo(0.1, 1);
      expect(drawn.y).toBeCloseTo(0.1, 1);
      expect(drawn.width).toBeCloseTo(0.5, 1);
      expect(drawn.height).toBeCloseTo(0.5, 1);

      // The placement is labelled as schematic, never as a realistic mockup.
      await expect(page.getByText(texts.schematic)).toBeVisible();

      // The selection is adjustable with the keyboard.
      const stageGroup = page.getByRole("group", { name: texts.stageGroup });
      await stageGroup.focus();
      const beforeX = Number(await selection.getAttribute("data-x"));
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(async () => Number(await selection.getAttribute("data-x")))
        .toBeGreaterThan(beforeX);
      await page.keyboard.press("Delete");
      await expect(selection).not.toBeAttached();

      // Clear and redraw from the action buttons.
      await page.getByRole("button", { name: texts.defaultCta }).click();
      await expect(selection).toBeAttached();
      expect(Number(await selection.getAttribute("data-width"))).toBeCloseTo(0.6, 1);
      await page.getByRole("button", { name: texts.clearCta }).click();
      await expect(selection).not.toBeAttached();
      await page.getByRole("button", { name: texts.defaultCta }).click();
      await expect(selection).toBeAttached();
      await page.getByRole("button", { name: texts.redrawCta }).click();
      await expect(selection).not.toBeAttached();

      // An unsupported file is refused with a clear, localised error.
      await page.locator('input[type="file"]').setInputFiles({
        name: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("this is not a photo"),
      });
      await expect(page.getByRole("alert").filter({ hasText: texts.typeError })).toBeVisible();
      // The previously uploaded photo is untouched.
      await expect(photo).toBeVisible();

      // The photo never leaves the browser.
      expect(foreign).toEqual([]);

      await expectNoHorizontalOverflow(page);
      expect(unexpected).toEqual([]);
    });
  }
});
