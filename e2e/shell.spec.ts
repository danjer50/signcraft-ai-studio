import { expect, test } from "@playwright/test";

import { locales } from "../src/i18n/config";
import { getMessages } from "../src/i18n/get-messages";

import { expectNoHorizontalOverflow, trackUnexpectedErrors } from "./helpers";

for (const locale of locales) {
  test(`/${locale} renders the home page in its language and direction, with no errors`, async ({
    page,
  }) => {
    const messages = getMessages(locale);
    const errors = trackUnexpectedErrors(page);

    const response = await page.goto(`/${locale}`);

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.home.title);
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("the root URL and a trailing slash redirect to the default locale", async ({ page }) => {
  await page.goto("/");
  expect(new URL(page.url()).pathname).toBe("/fr");

  await page.goto("/fr/");
  expect(new URL(page.url()).pathname).toBe("/fr");
});

test("the language switcher moves to the same page in another language", async ({ page }) => {
  const fr = getMessages("fr");
  const errors = trackUnexpectedErrors(page);

  await page.goto("/fr");
  const menu = page.getByRole("button", { name: fr.common.menu });
  if (await menu.isVisible()) {
    await menu.click();
  }
  await page.locator('a[hreflang="ar"]:visible').first().click();

  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(getMessages("ar").home.title);
  expect(errors).toEqual([]);
});

test("the skip link moves keyboard focus to the main content", async ({ page }) => {
  const messages = getMessages("en");
  await page.goto("/en");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: messages.common.skipToContent });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("on narrow screens the navigation opens from the menu button and closes with Escape", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "The desktop sidebar has no drawer.");
  const messages = getMessages("fr");
  const menu = page.getByRole("button", { name: messages.common.menu });
  const navigation = page.getByRole("navigation", { name: messages.common.primaryNavigation });

  await page.goto("/fr");
  await expect(navigation).toBeHidden();

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();
  await expect(menu).toBeFocused();
});

test("on wide screens the navigation is a sidebar and there is no menu button", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Only the desktop layout has the sidebar.");
  const messages = getMessages("en");

  await page.goto("/en");

  await expect(page.getByRole("button", { name: messages.common.menu })).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: messages.common.primaryNavigation }),
  ).toBeVisible();
});
