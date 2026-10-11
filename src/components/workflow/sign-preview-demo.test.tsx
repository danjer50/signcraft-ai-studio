import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { SignPreviewDemo } from "./sign-preview-demo";

// The demo persists its draft to localStorage: start every test from a clean draft.
beforeEach(() => {
  window.localStorage.clear();
});

function preview(label = "Sign preview") {
  return screen.getByRole("group", { name: label });
}

describe("SignPreviewDemo", () => {
  it("updates the preview instantly as the business name is typed", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    const textInput = screen.getByLabelText("Business name");
    await user.clear(textInput);
    await user.type(textInput, "Lumière");

    expect(preview()).toHaveTextContent("Lumière");
  });

  it("falls back to a placeholder phrase when the name is empty", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    await user.clear(screen.getByLabelText("Business name"));

    expect(preview()).toHaveTextContent("Your sign");
  });

  it("switches templates instantly and shows the template name in the preview", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    expect(preview()).toHaveAttribute("data-template", "channelLetters");
    expect(preview()).toHaveTextContent("Illuminated letters");

    await user.click(screen.getByRole("radio", { name: /Neon glow/ }));
    expect(preview()).toHaveAttribute("data-template", "neonScript");
    expect(preview()).toHaveAttribute("data-layout", "neon");
    expect(preview()).toHaveTextContent("Neon glow");

    await user.click(screen.getByRole("radio", { name: /Floor totem/ }));
    expect(preview()).toHaveAttribute("data-template", "totemPanel");
    expect(preview()).toHaveAttribute("data-layout", "totem");
    expect(preview()).toHaveTextContent("Floor totem");
  });

  it("applies colour changes to the preview instantly", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    // Default: warm white letters, azure light. "Ice" is offered for letters only,
    // "Emerald" for the light only, so each click targets one slot.
    expect(preview().style.getPropertyValue("--sign-face")).toBe("#fdeecf");

    await user.click(screen.getByRole("radio", { name: "Ice" }));
    expect(preview().style.getPropertyValue("--sign-face")).toBe("#dff4ff");

    await user.click(screen.getByRole("radio", { name: "Emerald" }));
    expect(preview().style.getPropertyValue("--sign-glow")).toBe("#34d399");
  });

  it("adapts the colour choices to the selected template", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    // channelLetters has Letter + Light slots; minimalLetters has only Letter.
    expect(screen.getByText("Letter colour")).toBeInTheDocument();
    expect(screen.getByText("Light colour")).toBeInTheDocument();
    expect(screen.queryByText("Accent colour")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /3D metal lettering/ }));
    expect(screen.getByText("Accent colour")).toBeInTheDocument();
    expect(screen.queryByText("Light colour")).not.toBeInTheDocument();
  });

  it("keeps the business name when switching templates and resets colours", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    await user.clear(screen.getByLabelText("Business name"));
    await user.type(screen.getByLabelText("Business name"), "Atelier");
    await user.click(screen.getByRole("radio", { name: "Silver" }));
    await user.click(screen.getByRole("radio", { name: /Neon glow/ }));

    expect(preview()).toHaveTextContent("Atelier");
    // Switching template resets colours to the new template's defaults (ice letters).
    expect(preview().style.getPropertyValue("--sign-face")).toBe("#dff4ff");
  });

  it("shows the optional tagline only when it has content", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    // The demo starts empty, so the preview shows the fallback phrase.
    expect(preview()).toHaveTextContent("Your sign");
    expect(preview()).not.toHaveTextContent("Bakery · Coffee");

    await user.type(screen.getByLabelText("Business name"), "Studio");
    await user.type(screen.getByLabelText("Tagline (optional)"), "Bakery · Coffee");
    expect(preview()).toHaveTextContent("Studio");
    expect(preview()).toHaveTextContent("Bakery · Coffee");
  });

  it("has no submit control: there is nothing to submit yet", () => {
    render(<SignPreviewDemo messages={getMessages("fr")} />);
    // The demo has working controls (upload, clear, …) but no form and no submit.
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector('button[type="submit"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /envoyer|valider|submit/i })).toBeNull();
  });

  it("renders the customisation in French and Arabic", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SignPreviewDemo messages={getMessages("fr")} />);
    expect(screen.getByRole("radio", { name: /Enseigne à ampoules/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du commerce")).toBeInTheDocument();
    unmount();

    render(<SignPreviewDemo messages={getMessages("ar")} />);
    expect(screen.getByRole("radio", { name: /لافتة بلمبات/ })).toBeInTheDocument();
    expect(screen.getByLabelText("اسم النشاط")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /عمود أرضي/ }));
    expect(preview("معاينة اللافتة")).toHaveAttribute("data-template", "totemPanel");
  });
});
