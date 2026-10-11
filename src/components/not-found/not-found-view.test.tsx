import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

import { NotFoundView } from "./not-found-view";

describe("NotFoundView", () => {
  it.each(locales)("shows the %s heading and a link back to that locale's home page", (locale) => {
    const messages = getMessages(locale);
    render(<NotFoundView locale={locale} messages={messages} />);

    expect(
      screen.getByRole("heading", { level: 1, name: messages.notFound.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.notFound.homeLink })).toHaveAttribute(
      "href",
      `/${locale}`,
    );
  });

  it("hides the decorative status code from assistive technology", () => {
    render(<NotFoundView locale="en" messages={getMessages("en")} />);

    expect(screen.getByText("404")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the explanation in Arabic for the Arabic locale", () => {
    const messages = getMessages("ar");
    render(<NotFoundView locale="ar" messages={messages} />);

    expect(screen.getByText(messages.notFound.body)).toBeInTheDocument();
    expect(messages.notFound.body).toMatch(/[\u0600-\u06FF]/);
  });
});
