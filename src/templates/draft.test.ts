import { describe, expect, it } from "vitest";

import {
  defaultDraft,
  draftWithTemplate,
  parseDraft,
  resolveColourValues,
  serializeDraft,
} from "./draft";

describe("customer draft", () => {
  it("starts on the default template with its default colours", () => {
    const draft = defaultDraft();
    expect(draft.version).toBe(1);
    expect(draft.templateId).toBe("channelLetters");
    expect(draft.text).toBe("");
    expect(draft.colours.face).toBe("warmWhite");
    expect(draft.colours.glow).toBe("azure");
  });

  it("round-trips through serialisation", () => {
    const draft = {
      ...defaultDraft(),
      templateId: "neonScript" as const,
      text: "Lumière",
      tagline: "Bakery · Coffee",
      colours: { face: "rose" as const, glow: "violet" as const, accent: "azure" as const },
    };
    const parsed = parseDraft(serializeDraft(draft));
    expect(parsed).toEqual(draft);
  });

  it("keeps the text and resets colours when the template changes", () => {
    const draft = { ...defaultDraft(), text: "Studio", tagline: "Café" };
    const switched = draftWithTemplate(draft, "marqueeBulbs");
    expect(switched.text).toBe("Studio");
    expect(switched.tagline).toBe("Café");
    expect(switched.templateId).toBe("marqueeBulbs");
    expect(switched.colours.glow).toBe("amber");
    expect(switched.colours.face).toBe("warmWhite");
  });

  it("refuses malformed drafts instead of guessing", () => {
    expect(parseDraft("not json")).toBeNull();
    expect(parseDraft("[]")).toBeNull();
    expect(parseDraft('{"version":2,"templateId":"neonScript"}')).toBeNull();
    expect(parseDraft('{"version":1,"templateId":"nope"}')).toBeNull();
    // Invalid colour ids for a declared slot are refused, not ignored.
    expect(
      parseDraft('{"version":1,"templateId":"neonScript","colours":{"face":"chartreuse"}}'),
    ).toBeNull();
    expect(
      parseDraft(
        '{"version":1,"templateId":"neonScript","colours":{"face":"rose","glow":"chartreuse"}}',
      ),
    ).toBeNull();
    // Missing slots fall back to the template defaults.
    const partial = parseDraft('{"version":1,"templateId":"neonScript","colours":{"face":"rose"}}');
    expect(partial?.colours.face).toBe("rose");
    expect(partial?.colours.glow).toBe("cyan");
  });

  it("clamps over-long text fields", () => {
    const raw = serializeDraft({
      ...defaultDraft(),
      text: "x".repeat(200),
      tagline: "y".repeat(200),
    });
    const parsed = parseDraft(raw);
    expect(parsed?.text).toHaveLength(64);
    expect(parsed?.tagline).toHaveLength(96);
  });

  it("resolves hex values for the preview", () => {
    const draft = {
      ...defaultDraft(),
      colours: { face: "gold" as const, glow: "cyan" as const, accent: "coral" as const },
    };
    expect(resolveColourValues(draft)).toEqual({
      face: "#facc15",
      glow: "#22d3ee",
      accent: "#fb7185",
    });
  });
});
