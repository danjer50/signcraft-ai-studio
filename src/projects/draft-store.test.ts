import { beforeEach, describe, expect, it } from "vitest";

import { clearDraft, loadDraft, saveDraft } from "./draft-store";
import { defaultDraft, draftWithTemplate, parseDraft } from "@/templates/draft";

describe("draft store (device-local persistence)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when nothing is saved", () => {
    expect(loadDraft()).toBeNull();
  });

  it("saves and reloads the draft", () => {
    const draft = { ...defaultDraft(), text: "Boulangerie", lettering: "classic" as const };
    expect(saveDraft(draft)).toBe(true);
    const loaded = loadDraft();
    expect(loaded).toEqual(draft);
  });

  it("keeps the draft across a simulated reload (fresh parse from storage)", () => {
    const draft = draftWithTemplate({ ...defaultDraft(), text: "Studio" }, "cafeMedina");
    saveDraft(draft);
    // A fresh load parses from storage exactly as a reload would.
    const raw = window.localStorage.getItem("signcraft-ai-studio:draft");
    expect(raw).not.toBeNull();
    expect(parseDraft(raw!)).toEqual(draft);
    expect(loadDraft()?.templateId).toBe("cafeMedina");
  });

  it("returns null for corrupted storage instead of throwing", () => {
    window.localStorage.setItem("signcraft-ai-studio:draft", "{not json");
    expect(loadDraft()).toBeNull();
    window.localStorage.setItem("signcraft-ai-studio:draft", '{"version":99}');
    expect(loadDraft()).toBeNull();
  });

  it("clears the saved draft", () => {
    saveDraft(defaultDraft());
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});
