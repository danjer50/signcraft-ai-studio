import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { FoundationOverview } from "./foundation-overview";

describe("FoundationOverview", () => {
  it("states what works today and labels every product module as planned", () => {
    render(<FoundationOverview messages={getMessages("en")} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Studio foundation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "What works today" })).toBeInTheDocument();

    const modules = screen.getByRole("region", { name: "Planned modules" });
    const articles = within(modules).getAllByRole("article");
    expect(articles).toHaveLength(5);
    for (const article of articles) {
      expect(within(article).getByText("Planned")).toBeInTheDocument();
    }
    expect(
      within(modules).getByRole("heading", { level: 3, name: "2D editor" }),
    ).toBeInTheDocument();
    expect(within(modules).getByRole("heading", { level: 3, name: "Exports" })).toBeInTheDocument();
  });

  it("contains no buttons, forms or links, so it offers no features that do not exist yet", () => {
    const { container } = render(<FoundationOverview messages={getMessages("fr")} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(container.querySelector("form")).toBeNull();
  });

  it("renders in Arabic", () => {
    render(<FoundationOverview messages={getMessages("ar")} />);

    expect(screen.getByRole("heading", { level: 1, name: "أساس الاستوديو" })).toBeInTheDocument();
    const modules = screen.getByRole("region", { name: "الوحدات المخططة" });
    expect(within(modules).getAllByText("مخطط")).toHaveLength(5);
  });
});
