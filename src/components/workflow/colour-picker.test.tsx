import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import { getTemplate } from "@/templates/catalogue";

import { ColourPicker } from "./colour-picker";

describe("ColourPicker", () => {
  it("shows named swatches for each slot of the template", () => {
    render(
      <ColourPicker
        messages={getMessages("en")}
        template={getTemplate("neonScript")}
        value={{ face: "ice", glow: "cyan", accent: "azure" }}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("group", { name: "Colours" })).toBeInTheDocument();
    expect(screen.getByText("Letter colour")).toBeInTheDocument();
    expect(screen.getByText("Light colour")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Warm white" })).toBeInTheDocument();
  });

  it("reports colour changes with the slot role", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColourPicker
        messages={getMessages("en")}
        template={getTemplate("minimalLetters")}
        value={{ face: "ice", glow: "cyan", accent: "azure" }}
        onChange={onChange}
      />,
    );

    // minimalLetters customises letters only.
    expect(screen.queryByText("Light colour")).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Rose" }));
    expect(onChange).toHaveBeenCalledWith("face", "rose");
  });

  it("marks the current colour of each slot", () => {
    render(
      <ColourPicker
        messages={getMessages("fr")}
        template={getTemplate("dimensionalMetal")}
        value={{ face: "copper", glow: "cyan", accent: "gold" }}
        onChange={() => {}}
      />,
    );

    const letters = screen.getByText("Couleur des lettres").parentElement;
    expect(letters).not.toBeNull();
    expect(within(letters as HTMLElement).getByRole("radio", { name: "Cuivre" })).toBeChecked();
    const accent = screen.getByText("Couleur d'accent").parentElement;
    expect(accent).not.toBeNull();
    expect(within(accent as HTMLElement).getByRole("radio", { name: "Or" })).toBeChecked();
  });
});
