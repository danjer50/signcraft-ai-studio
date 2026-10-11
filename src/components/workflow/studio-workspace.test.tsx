import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import { loadProject } from "@/projects/project-store";

import { StudioWorkspace } from "./studio-workspace";

const messages = getMessages("en");
const workspace = messages.pro.workspace;

beforeEach(() => {
  window.localStorage.clear();
});

describe("StudioWorkspace", () => {
  it("offers fabrication controls, a front view and a side view", () => {
    render(<StudioWorkspace locale="en" messages={messages} />);

    expect(screen.getByRole("heading", { name: workspace.controls })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: workspace.frontView })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: workspace.sideView })).toBeInTheDocument();
    // The front view is the real composition preview, not an illustration.
    expect(
      screen.getByTestId("studio-workspace").querySelector('[data-preview-role="main"]'),
    ).not.toBeNull();

    // The four fabrication attributes are editable and labelled.
    expect(screen.getByRole("combobox", { name: workspace.construction })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: workspace.material })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: workspace.lighting })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: workspace.finish })).toBeInTheDocument();
  });

  it("keeps the side view in sync with the physical dimensions", async () => {
    const user = userEvent.setup();
    render(<StudioWorkspace locale="en" messages={messages} />);

    const controls = screen.getByRole("heading", { name: workspace.controls }).closest("section")!;
    const height = within(controls).getByLabelText(workspace.height);
    await user.clear(height);
    await user.type(height, "800");

    expect(screen.getByText("800 mm")).toBeInTheDocument();
  });

  it("shows the projection for projecting constructions", async () => {
    const user = userEvent.setup();
    render(<StudioWorkspace locale="en" messages={messages} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: workspace.construction }),
      "projecting",
    );

    // The front view's badge mirrors the construction…
    const front = screen.getByRole("heading", { name: workspace.frontView }).closest("section")!;
    expect(within(front).getByText(workspace.constructions.projecting)).toBeInTheDocument();
    // …and the side view switches from thickness to projection.
    expect(screen.getByText(/Projection/)).toBeInTheDocument();
  });

  it("saves the project on this device and restores it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<StudioWorkspace locale="en" messages={messages} />);

    const controls = screen.getByRole("heading", { name: workspace.controls }).closest("section")!;
    const width = within(controls).getByLabelText(workspace.width);
    await user.clear(width);
    await user.type(width, "1200");
    await user.click(screen.getByRole("button", { name: workspace.save }));

    expect(await screen.findByRole("status")).toHaveTextContent(workspace.saved);

    const stored = loadProject();
    expect(stored?.physical.widthMm).toBe(1200);

    // A fresh mount restores the stored project.
    unmount();
    render(<StudioWorkspace locale="en" messages={messages} />);
    const restored = screen.getByRole("heading", { name: workspace.controls }).closest("section")!;
    expect(within(restored).getByLabelText(workspace.width)).toHaveValue(1200);
  });
});
