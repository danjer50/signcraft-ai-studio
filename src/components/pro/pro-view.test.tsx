import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { ProView } from "./pro-view";

describe("ProView", () => {
  it("introduces the professional workspace for sign makers", () => {
    render(<ProView locale="fr" messages={getMessages("fr")} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Espace professionnel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "À qui s'adresse cet espace" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ce point d'entrée s'adresse aux enseignistes/)).toBeInTheDocument();
    expect(screen.getByText(/rien sur cette page n'est un éditeur/)).toBeInTheDocument();
  });

  it("labels every planned tool and builds no fake editor", () => {
    render(<ProView locale="en" messages={getMessages("en")} />);

    const tools = screen.getByRole("region", { name: "Planned tools" });
    const articles = within(tools).getAllByRole("article");
    expect(articles).toHaveLength(5);
    for (const article of articles) {
      expect(within(article).getByText("Planned")).toBeInTheDocument();
    }
    expect(within(tools).getByRole("heading", { level: 3, name: "2D editor" })).toBeInTheDocument();
    expect(within(tools).getByRole("heading", { level: 3, name: "Exports" })).toBeInTheDocument();

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  it("links back to the working customer flow", () => {
    render(<ProView locale="en" messages={getMessages("en")} />);

    expect(screen.getByRole("link", { name: "Try the customer flow" })).toHaveAttribute(
      "href",
      "/en/create",
    );
  });

  it("renders in Arabic", () => {
    render(<ProView locale="ar" messages={getMessages("ar")} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "مساحة العمل الاحترافية" }),
    ).toBeInTheDocument();
    const tools = screen.getByRole("region", { name: "الأدوات المخطط لها" });
    expect(within(tools).getAllByText("مخطط")).toHaveLength(5);
  });
});
