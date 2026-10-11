import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import { getTemplate } from "@/templates/catalogue";

import { SignPreview } from "./sign-preview";

const colours = { face: "#dff4ff", glow: "#22d3ee", accent: "#7dd3fc" };

/** Renders the preview with a template's real composition and default lettering. */
function renderTemplate(
  templateId: "neonScript" | "marqueeBulbs" | "minimalLetters" | "cafeMedina",
  overrides: Record<string, unknown> = {},
) {
  const template = getTemplate(templateId);
  return render(
    <SignPreview
      messages={getMessages("en")}
      templateId={template.id}
      templateName={templateId}
      layout={template.layout}
      colours={colours}
      text="Lumière"
      tagline=""
      composition={template.composition}
      lettering={template.composition.lettering}
      {...overrides}
    />,
  );
}

describe("SignPreview", () => {
  it("renders the text in the selected template and exposes the ids for tests", () => {
    renderTemplate("neonScript", { templateName: "Neon glow" });

    const preview = screen.getByRole("group", { name: "Sign preview" });
    expect(preview).toHaveAttribute("data-template", "neonScript");
    expect(preview).toHaveAttribute("data-layout", "neon");
    expect(preview).toHaveTextContent("Lumière");
    expect(preview).toHaveTextContent("Neon glow");
    expect(preview).not.toHaveTextContent("Your sign");
  });

  it("renders the template composition: frame, emblem, arrangement, lettering and scene", () => {
    renderTemplate("cafeMedina");

    const preview = screen.getByRole("group", { name: "Sign preview" });
    expect(preview).toHaveAttribute("data-frame", "awning");
    expect(preview).toHaveAttribute("data-arrangement", "band");
    expect(preview).toHaveAttribute("data-lettering", "classic");
    expect(preview).toHaveAttribute("data-background", "dusk");
    // The emblem is decorative SVG artwork inside the composition.
    expect(preview.querySelector("svg")).not.toBeNull();
    // The lettering style is exposed on the text element for styling and tests.
    const signText = preview.querySelector("[data-lettering]");
    expect(signText).toHaveAttribute("data-lettering", "classic");
  });

  it("marks Arabic text so letter-spacing never breaks cursive joining", () => {
    renderTemplate("cafeMedina", { text: "مقهى المدينة" });

    const signText = screen
      .getByRole("group", { name: "Sign preview" })
      .querySelector("[data-lettering]");
    expect(signText).toHaveAttribute("data-script", "ar");
  });

  it("does not mark Latin text as Arabic", () => {
    renderTemplate("cafeMedina", { text: "Cafe Medina" });

    const signText = screen
      .getByRole("group", { name: "Sign preview" })
      .querySelector("[data-lettering]");
    expect(signText).not.toHaveAttribute("data-script");
  });

  it("applies the colours as CSS custom properties", () => {
    renderTemplate("marqueeBulbs", { text: "Studio", tagline: "Café" });

    const preview = screen.getByRole("group", { name: "Sign preview" });
    expect(preview.style.getPropertyValue("--sign-face")).toBe("#dff4ff");
    expect(preview.style.getPropertyValue("--sign-glow")).toBe("#22d3ee");
    expect(preview.style.getPropertyValue("--sign-accent")).toBe("#7dd3fc");
    expect(preview).toHaveTextContent("Café");
  });

  it("falls back to the placeholder phrase for empty text", () => {
    renderTemplate("minimalLetters", {
      messages: getMessages("fr"),
      templateName: "Minimal elegance",
      text: "   ",
    });

    expect(screen.getByRole("group", { name: "Aperçu de l'enseigne" })).toHaveTextContent(
      "Votre enseigne",
    );
  });
});
