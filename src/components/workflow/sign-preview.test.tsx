import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { SignPreview } from "./sign-preview";

const colours = { face: "#dff4ff", glow: "#22d3ee", accent: "#7dd3fc" };

describe("SignPreview", () => {
  it("renders the text in the selected template and exposes the ids for tests", () => {
    render(
      <SignPreview
        messages={getMessages("en")}
        templateId="neonScript"
        templateName="Neon glow"
        layout="neon"
        colours={colours}
        text="Lumière"
        tagline=""
      />,
    );

    const preview = screen.getByRole("group", { name: "Sign preview" });
    expect(preview).toHaveAttribute("data-template", "neonScript");
    expect(preview).toHaveAttribute("data-layout", "neon");
    expect(preview).toHaveTextContent("Lumière");
    expect(preview).toHaveTextContent("Neon glow");
    expect(preview).not.toHaveTextContent("Your sign");
  });

  it("applies the colours as CSS custom properties", () => {
    render(
      <SignPreview
        messages={getMessages("en")}
        templateId="marqueeBulbs"
        templateName="Marquee bulbs"
        layout="marquee"
        colours={colours}
        text="Studio"
        tagline="Café"
      />,
    );

    const preview = screen.getByRole("group", { name: "Sign preview" });
    expect(preview.style.getPropertyValue("--sign-face")).toBe("#dff4ff");
    expect(preview.style.getPropertyValue("--sign-glow")).toBe("#22d3ee");
    expect(preview.style.getPropertyValue("--sign-accent")).toBe("#7dd3fc");
    expect(preview).toHaveTextContent("Café");
  });

  it("falls back to the placeholder phrase for empty text", () => {
    render(
      <SignPreview
        messages={getMessages("fr")}
        templateId="minimalLetters"
        templateName="Minimal elegance"
        layout="minimal"
        colours={colours}
        text="   "
        tagline=""
      />,
    );

    expect(screen.getByRole("group", { name: "Aperçu de l'enseigne" })).toHaveTextContent(
      "Votre enseigne",
    );
  });
});
