import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { LetteringPicker } from "./lettering-picker";

describe("LetteringPicker", () => {
  it("renders every lettering style with a live sample", () => {
    render(<LetteringPicker messages={getMessages("en")} value="modern" onChange={() => {}} />);

    const options = screen.getAllByRole("radio");
    expect(options.length).toBe(10);
    // Each option shows the Latin + Arabic sample rendered in its own style.
    const samples = screen.getAllByText("Aa أب");
    expect(samples.length).toBe(10);
    expect(samples[1]).toHaveAttribute("data-lettering", "classic");
  });

  it("marks the selected style and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LetteringPicker messages={getMessages("en")} value="modern" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /Modern sans/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /Kufi/ }));
    expect(onChange).toHaveBeenCalledWith("kufi");
  });

  it("localises the style names", () => {
    render(<LetteringPicker messages={getMessages("ar")} value="kufi" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /كوفي/ })).toBeChecked();
  });
});
