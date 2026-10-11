import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import { signTemplates } from "@/templates/catalogue";

import { TemplateGallery } from "./template-gallery";

describe("TemplateGallery", () => {
  it("shows one preview card per template with its name and category", () => {
    render(
      <TemplateGallery
        messages={getMessages("en")}
        value="channelLetters"
        onChange={() => {}}
        text=""
        tagline=""
      />,
    );

    const cards = screen.getAllByRole("radio");
    expect(cards.length).toBe(signTemplates.length);
    expect(screen.getByRole("radio", { name: /Illuminated letters/ })).toBeChecked();
    // Categories are localised.
    expect(screen.getAllByText("Retail").length).toBeGreaterThan(0);
  });

  it("previews each complete design with the sample name when the field is empty", () => {
    render(
      <TemplateGallery
        messages={getMessages("en")}
        value="channelLetters"
        onChange={() => {}}
        text=""
        tagline=""
      />,
    );

    // The gallery cards render the finished compositions (emblem SVGs included).
    const cafeCard = screen.getByRole("radio", { name: /Café awning/ }).closest("label");
    expect(cafeCard?.querySelector("svg")).not.toBeNull();
    expect(cafeCard).toHaveTextContent("Your Sign");
  });

  it("uses the customer's typed name in the card previews", () => {
    render(
      <TemplateGallery
        messages={getMessages("en")}
        value="channelLetters"
        onChange={() => {}}
        text="Chez Mario"
        tagline=""
      />,
    );

    expect(screen.getAllByText("Chez Mario").length).toBe(signTemplates.length);
  });

  it("reports the selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TemplateGallery
        messages={getMessages("en")}
        value="channelLetters"
        onChange={onChange}
        text=""
        tagline=""
      />,
    );

    await user.click(screen.getByRole("radio", { name: /Café awning/ }));
    expect(onChange).toHaveBeenCalledWith("cafeMedina");
  });
});
