import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { HomeView } from "./home-view";

describe("HomeView", () => {
  it("leads with the product headline and the two real calls to action", () => {
    render(<HomeView locale="fr" messages={getMessages("fr")} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "VOTRE IDÉE. NOTRE IA. VOTRE ENSEIGNE PARFAITE.",
      }),
    ).toBeInTheDocument();

    const createLink = screen.getByRole("link", { name: "Créer mon enseigne" });
    expect(createLink).toHaveAttribute("href", "/fr/create");

    const examplesLink = screen.getByRole("link", { name: "Explorer des exemples de créations" });
    expect(examplesLink).toHaveAttribute("href", "#examples");
  });

  it("offers the professional workspace as a separate entry point", () => {
    render(<HomeView locale="fr" messages={getMessages("fr")} />);

    const proLink = screen.getByRole("link", { name: "Découvrir l'espace professionnel" });
    expect(proLink).toHaveAttribute("href", "/fr/pro");
  });

  it("renders exactly one level-1 heading", () => {
    render(<HomeView locale="en" messages={getMessages("en")} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders in Arabic", () => {
    render(<HomeView locale="ar" messages={getMessages("ar")} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "فكرتك. ذكاؤنا الاصطناعي. لافتتك المثالية." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "أنشئ لافتتي" })).toHaveAttribute("href", "/ar/create");
    expect(screen.getByRole("link", { name: "استكشف مساحة العمل الاحترافية" })).toHaveAttribute(
      "href",
      "/ar/pro",
    );
  });
});
