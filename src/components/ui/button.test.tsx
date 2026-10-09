import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, buttonClassName } from "./button";

describe("Button", () => {
  it("is a submit-safe button by default and uses the primary variant", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "primary");
  });

  it("passes through the requested variant and attributes", () => {
    render(
      <Button variant="secondary" aria-label="Close" className="extra">
        ×
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toHaveAttribute("data-variant", "secondary");
    expect(button.className).toContain("extra");
  });

  it("exposes the same styling to links through buttonClassName", () => {
    const primary = buttonClassName();
    expect(primary).toBe(buttonClassName({ variant: "primary" }));
    expect(buttonClassName({ variant: "ghost", className: "wide" })).toContain("wide");
    expect(buttonClassName({ variant: "ghost" })).not.toBe(primary);
  });
});
