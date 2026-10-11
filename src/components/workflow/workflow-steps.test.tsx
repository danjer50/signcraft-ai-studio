import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { WorkflowSteps } from "./workflow-steps";

describe("WorkflowSteps", () => {
  it("shows the four customer steps with honest status labels", () => {
    const messages = getMessages("en");
    render(<WorkflowSteps messages={messages} />);

    const steps = screen.getByRole("list", { name: "Creation steps" });
    const items = within(steps).getAllByRole("listitem");
    expect(items).toHaveLength(4);

    expect(
      within(steps).getByRole("heading", { level: 3, name: "Describe the sign" }),
    ).toBeInTheDocument();
    expect(
      within(steps).getByRole("heading", { level: 3, name: "Request changes or continue" }),
    ).toBeInTheDocument();

    expect(within(steps).getAllByText("In this demo")).toHaveLength(3);
    expect(within(steps).getAllByText("Planned")).toHaveLength(1);
  });

  it("labels step 4 as planned and offers no controls for it", () => {
    render(<WorkflowSteps messages={getMessages("en")} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    const last = items.at(-1);
    if (!last) {
      throw new Error("expected four workflow steps");
    }
    expect(last).toHaveAttribute("data-planned", "true");
    expect(within(last).getByText("Planned")).toBeInTheDocument();
    expect(within(last).queryAllByRole("button")).toHaveLength(0);
    expect(within(last).queryAllByRole("link")).toHaveLength(0);
  });

  it("renders in French and Arabic", () => {
    const { unmount } = render(<WorkflowSteps messages={getMessages("fr")} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Décrire l'enseigne" }),
    ).toBeInTheDocument();
    unmount();

    render(<WorkflowSteps messages={getMessages("ar")} />);
    expect(screen.getByRole("heading", { level: 3, name: "صف اللافتة" })).toBeInTheDocument();
  });
});
