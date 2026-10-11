import { expect, test } from "@playwright/test";

import { defaultLocale, locales, type Locale } from "../src/i18n/config";
import { getMessages } from "../src/i18n/get-messages";

import { expectNoHorizontalOverflow, trackUnexpectedErrors } from "./helpers";

const unknownUrls: Array<{ path: string; locale: Locale; note: string }> = [
  { path: "/fr/does-not-exist", locale: "fr", note: "unknown path under French" },
  { path: "/en/a/b", locale: "en", note: "two-level unknown path under English" },
  { path: "/ar/x", locale: "ar", note: "unknown path under Arabic" },
  { path: "/de", locale: defaultLocale, note: "unknown locale, falls back to the default" },
  { path: "/de/x/y", locale: defaultLocale, note: "unknown locale with a deeper path" },
  { path: "/nope", locale: defaultLocale, note: "no locale at all" },
  { path: "/fr/projects", locale: "fr", note: "planned section that is not built yet" },
];

for (const { path, locale, note } of unknownUrls) {
  test(`${path} (${note}) returns 404 with the ${locale} page`, async ({ page }) => {
    const copy = getMessages(locale).notFound;
    const errors = trackUnexpectedErrors(page, [path]);

    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.heading);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.getByRole("banner")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

for (const locale of locales) {
  test(`the ${locale} 404 page links back to the ${locale} home page`, async ({ page }) => {
    const messages = getMessages(locale);
    const errors = trackUnexpectedErrors(page, [`/${locale}/does-not-exist`]);

    await page.goto(`/${locale}/does-not-exist`);
    await page.getByRole("link", { name: messages.notFound.homeLink }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.home.title);
    expect(errors).toEqual([]);
  });
}

test("the language switcher on a 404 page keeps the same path and changes the language", async ({
  page,
}) => {
  const fr = getMessages("fr");
  const en = getMessages("en");
  // The switch navigates from one unknown URL to another, so both are expected to be 404s.
  const errors = trackUnexpectedErrors(page, ["/fr/does-not-exist", "/en/does-not-exist"]);

  await page.goto("/fr/does-not-exist");
  // On narrow screens the switcher is inside the drawer, so open it first.
  const menu = page.getByRole("button", { name: fr.common.menu });
  if (await menu.isVisible()) {
    await menu.click();
  }
  await page.locator('a[hreflang="en"]:visible').first().click();

  await expect(page).toHaveURL(/\/en\/does-not-exist$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.notFound.heading);
  expect(errors).toEqual([]);
});
