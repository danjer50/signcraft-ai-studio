import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import { signTemplates } from "@/templates/catalogue";

import { TemplatePicker } from "./template-picker";

describe("TemplatePicker", () => {
  it("lists every template with its localised name and hint", () => {
    render(
      <TemplatePicker messages={getMessages("en")} value="channelLetters" onChange={() => {}} />,
    );

    expect(screen.getByRole("group", { name: "Template" })).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(signTemplates.length);
    expect(screen.getByRole("radio", { name: /Projecting blade sign/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Window vinyl/ })).toBeInTheDocument();
  });

  it("reports the chosen template and marks the selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TemplatePicker messages={getMessages("fr")} value="neonScript" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /Éclat néon/ })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /Totem au sol/ }));
    expect(onChange).toHaveBeenCalledWith("totemPanel");
  });
});
