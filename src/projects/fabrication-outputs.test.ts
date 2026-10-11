import { describe, expect, it } from "vitest";

import { defaultProject } from "./sign-project";
import { buildCutListCsv, buildPanelDxf } from "./fabrication-outputs";

describe("buildCutListCsv", () => {
  it("lists the panel with its exact structured dimensions", () => {
    const project = {
      ...defaultProject(),
      physical: { widthMm: 2400, heightMm: 800, depthMm: 120, units: "mm" as const },
      material: "alucobond" as const,
      construction: "projecting" as const,
    };
    const csv = buildCutListCsv(project);
    const [header, row] = csv.trim().split("\n");
    expect(header).toBe("item,construction,material,finish,width_mm,height_mm,depth_mm,quantity");
    expect(row).toBe('"panel","projecting","alucobond","matte",2400,800,120,1');
  });
});

describe("buildPanelDxf", () => {
  it("produces a valid R12 DXF with the panel rectangle in millimetres", () => {
    const project = {
      ...defaultProject(),
      physical: { widthMm: 900, heightMm: 300, depthMm: 30, units: "mm" as const },
    };
    const dxf = buildPanelDxf(project);

    // Structure: HEADER with millimetre units, one ENTITIES section, EOF.
    expect(dxf).toContain("$INSUNITS\n70\n4");
    expect(dxf.trim().endsWith("EOF")).toBe(true);
    const lines = (dxf.match(/^LINE$/gm) ?? []).length;
    expect(lines).toBe(4);

    // The rectangle corners match the structured dimensions exactly.
    expect(dxf).toContain("11\n900");
    expect(dxf).toContain("21\n300");
  });
});
