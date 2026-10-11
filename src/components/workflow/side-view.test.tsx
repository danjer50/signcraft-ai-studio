import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import type { PhysicalSpec } from "@/projects/sign-project";

import { computeSideViewGeometry, SideView } from "./side-view";

const spec: PhysicalSpec = { widthMm: 900, heightMm: 300, depthMm: 30, units: "mm" };

describe("computeSideViewGeometry", () => {
  it("draws a thin panel flat against the wall for wall-mounted signs", () => {
    const geometry = computeSideViewGeometry(spec, "wallPanel");
    expect(geometry.bracket).toBeNull();
    // The panel touches the wall band.
    expect(geometry.panel.x).toBeCloseTo(geometry.wall.x + geometry.wall.width, 2);
    // Thin: the drawn depth is small relative to the height.
    expect(geometry.panel.width).toBeLessThan(geometry.panel.height);
  });

  it("projects the panel away from the wall with a bracket for projecting signs", () => {
    const projecting: PhysicalSpec = { widthMm: 600, heightMm: 600, depthMm: 400, units: "mm" };
    const geometry = computeSideViewGeometry(projecting, "projecting");
    expect(geometry.bracket).not.toBeNull();
    // The panel stands off from the wall by the scaled projection distance.
    expect(geometry.panel.x).toBeGreaterThan(geometry.wall.x + geometry.wall.width);
    // The projection is represented: panel is away from the wall, bracket spans the gap.
    expect(geometry.bracket!.x1).toBeCloseTo(geometry.wall.x + geometry.wall.width, 2);
    expect(geometry.bracket!.x2).toBeCloseTo(geometry.panel.x, 2);
  });

  it("scales taller signs down so they always fit the view", () => {
    const tall: PhysicalSpec = { widthMm: 300, heightMm: 3000, depthMm: 30, units: "mm" };
    const geometry = computeSideViewGeometry(tall, "wallPanel");
    expect(geometry.panel.height).toBeLessThanOrEqual(220 - 2 * 28 + 1);
    expect(geometry.panel.height).toBeGreaterThan(0);
  });

  it("never collapses a small depth to zero (readable minimum thickness)", () => {
    const thin: PhysicalSpec = { widthMm: 900, heightMm: 300, depthMm: 5, units: "mm" };
    const geometry = computeSideViewGeometry(thin, "wallPanel");
    expect(geometry.panel.width).toBeGreaterThanOrEqual(3);
  });
});

describe("SideView", () => {
  it("shows the height and depth dimensions in millimetres", () => {
    render(
      <SideView
        messages={getMessages("en")}
        physical={spec}
        construction="wallPanel"
        material="alucobond"
        finish="matte"
      />,
    );
    expect(screen.getByText(/300 mm/)).toBeInTheDocument();
    expect(screen.getByText(/Thickness 30 mm/)).toBeInTheDocument();
    expect(screen.getByText(/Schematic profile/)).toBeInTheDocument();
  });

  it("labels the projection for projecting signs", () => {
    render(
      <SideView
        messages={getMessages("fr")}
        physical={{ widthMm: 600, heightMm: 600, depthMm: 400, units: "mm" }}
        construction="projecting"
        material="steel"
        finish="chrome"
      />,
    );
    expect(screen.getByText(/Projection 400 mm/)).toBeInTheDocument();
  });
});
