import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
  it("defaults to the neutral tone", () => {
    render(<Badge>Planned</Badge>);
    expect(screen.getByText("Planned")).toHaveAttribute("data-tone", "neutral");
  });

  it("applies the requested tone", () => {
    render(<Badge tone="warning">Check</Badge>);
    expect(screen.getByText("Check")).toHaveAttribute("data-tone", "warning");
  });
});
