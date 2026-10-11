import { describe, expect, it } from "vitest";

import { defaultDraft } from "@/templates/draft";

import {
  clampPhysical,
  defaultProject,
  defaultPhysicalSpec,
  isProjecting,
  parseProject,
  projectFromDraft,
  serializeProject,
} from "./sign-project";

describe("sign project model", () => {
  it("builds a project around an existing draft (Normal Mode → Pro handoff)", () => {
    const draft = { ...defaultDraft(), text: "Boulangerie", lettering: "classic" as const };
    const project = projectFromDraft(draft);
    expect(project.draft.text).toBe("Boulangerie");
    expect(project.construction).toBe("wallPanel");
    expect(project.material).toBe("alucobond");
    expect(project.lighting).toBe("none");
    expect(project.finish).toBe("matte");
    expect(project.physical.units).toBe("mm");
  });

  it("round-trips through serialisation", () => {
    const project = defaultProject();
    project.draft.text = "Studio";
    project.construction = "projecting";
    project.lighting = "halo";
    project.physical = { widthMm: 1200, heightMm: 400, depthMm: 180, units: "mm" };
    const parsed = parseProject(serializeProject(project));
    expect(parsed).toEqual(project);
  });

  it("refuses malformed projects instead of guessing", () => {
    expect(parseProject("{not json")).toBeNull();
    expect(parseProject('{"version":99}')).toBeNull();
    const base = defaultProject();
    const withBadDraft = { ...base, draft: { version: 99 } };
    expect(parseProject(serializeProject(withBadDraft as never))).toBeNull();
    const withBadConstruction = { ...base, construction: "neon" };
    expect(parseProject(serializeProject(withBadConstruction as never))).toBeNull();
    const withBadLighting = { ...base, lighting: "disco" };
    expect(parseProject(serializeProject(withBadLighting as never))).toBeNull();
    const withBadPhysical = { ...base, physical: { widthMm: -5, heightMm: 0, depthMm: 1e9 } };
    // Invalid dimensions are clamped into range, not rejected (fabrication ranges).
    const parsed = parseProject(serializeProject(withBadPhysical as never));
    expect(parsed?.physical.widthMm).toBe(50);
    expect(parsed?.physical.depthMm).toBe(1000);
  });

  it("clamps physical specs into the fabrication ranges", () => {
    const spec = clampPhysical({
      widthMm: 10,
      heightMm: 99999,
      depthMm: Number.NaN,
      units: "mm",
    });
    expect(spec.widthMm).toBe(50);
    expect(spec.heightMm).toBe(3000);
    expect(spec.depthMm).toBe(5);
    expect(defaultPhysicalSpec().widthMm).toBeGreaterThan(0);
  });

  it("distinguishes projecting constructions from wall-mounted ones", () => {
    expect(isProjecting("projecting")).toBe(true);
    expect(isProjecting("wallPanel")).toBe(false);
    expect(isProjecting("alucobond")).toBe(false);
    expect(isProjecting("channelLetters")).toBe(false);
    expect(isProjecting("totem")).toBe(false);
  });
});
