import { beforeEach, describe, expect, it } from "vitest";

import { loadProject, saveProject } from "./project-store";
import { defaultProject } from "./sign-project";

describe("project store (device-local persistence)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns a default project when nothing is saved", () => {
    expect(loadProject().version).toBe(1);
  });

  it("saves and reloads the project", () => {
    const project = defaultProject();
    project.draft.text = "Atelier";
    project.construction = "projecting";
    expect(saveProject(project)).toBe(true);
    const loaded = loadProject();
    expect(loaded.draft.text).toBe("Atelier");
    expect(loaded.construction).toBe("projecting");
  });

  it("falls back to a default project for corrupted storage", () => {
    window.localStorage.setItem("signcraft-ai-studio:project", "{corrupted");
    expect(loadProject().version).toBe(1);
  });
});
