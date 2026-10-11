import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { CreateView } from "./create-view";

// The demo persists its draft to localStorage: start every test from a clean draft.
beforeEach(() => {
  window.localStorage.clear();
});

describe("CreateView", () => {
  it("explains the journey and runs the demo for steps 1 to 3", () => {
    render(<CreateView messages={getMessages("en")} />);

    expect(screen.getByRole("heading", { level: 1, name: "Create my sign" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "How customers create their sign" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Live style preview" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Sign preview" })).toBeInTheDocument();
  });

  it("states the limits of the demonstration in plain language", () => {
    render(<CreateView messages={getMessages("en")} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "What this preview is" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not an AI-generated design/i)).toBeInTheDocument();
    expect(screen.getByText(/does not analyse images/i)).toBeInTheDocument();
  });

  it("offers no controls for the planned step 4", () => {
    render(<CreateView messages={getMessages("en")} />);

    // The planned step 4 card is description only: no button, link or field in it.
    const plannedStep = document.querySelector('li[data-planned="true"]') as HTMLElement;
    expect(plannedStep).not.toBeNull();
    expect(plannedStep.querySelectorAll("button, a, input, select, textarea")).toHaveLength(0);

    // Nothing on the page submits: there is no form and no submit control.
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector('button[type="submit"]')).toBeNull();
  });

  it("renders in French and Arabic", () => {
    const { unmount } = render(<CreateView messages={getMessages("fr")} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Créer mon enseigne" }),
    ).toBeInTheDocument();
    unmount();

    render(<CreateView messages={getMessages("ar")} />);
    expect(screen.getByRole("heading", { level: 1, name: "أنشئ لافتتي" })).toBeInTheDocument();
  });
});
