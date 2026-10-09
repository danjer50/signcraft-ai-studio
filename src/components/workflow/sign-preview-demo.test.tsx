import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { SignPreviewDemo } from "./sign-preview-demo";

function previewText() {
  return screen.getByRole("group", { name: "Sign preview" }).querySelector("p");
}

describe("SignPreviewDemo", () => {
  it("updates the preview as the sign text is typed", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    const textInput = screen.getByLabelText("Sign text");
    await user.clear(textInput);
    await user.type(textInput, "Lumière");

    expect(previewText()).toHaveTextContent("Lumière");
  });

  it("falls back to a placeholder phrase when the text is empty", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    await user.clear(screen.getByLabelText("Sign text"));

    expect(previewText()).toHaveTextContent("Your sign");
  });

  it("switches the visual direction of the preview", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    const preview = screen.getByRole("group", { name: "Sign preview" });
    expect(preview).toHaveAttribute("data-style", "channel");

    await user.click(screen.getByRole("radio", { name: /Neon glow/ }));
    expect(preview).toHaveAttribute("data-style", "neon");

    await user.click(screen.getByRole("radio", { name: /Minimal elegance/ }));
    expect(preview).toHaveAttribute("data-style", "minimal");
  });

  it("shows the optional tagline only when it has content", async () => {
    const user = userEvent.setup();
    render(<SignPreviewDemo messages={getMessages("en")} />);

    expect(previewText()).toHaveTextContent("Studio");

    await user.type(screen.getByLabelText("Tagline (optional)"), "Bakery · Coffee");
    const preview = screen.getByRole("group", { name: "Sign preview" });
    expect(preview).toHaveTextContent("Bakery · Coffee");
  });

  it("has no submit button: there is nothing to submit yet", () => {
    render(<SignPreviewDemo messages={getMessages("fr")} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(document.querySelector("form")).toBeNull();
  });
});
