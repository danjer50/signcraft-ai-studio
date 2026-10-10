import { describe, expect, it } from "vitest";

import type { PhotoMeta } from "./types";

import {
  clampRect,
  clearSelection,
  defaultDraft,
  draftWithPhoto,
  draftWithSelection,
  draftWithTemplate,
  MIN_SELECTION,
  parseDraft,
  resolveColourValues,
  serializeDraft,
} from "./draft";

const samplePhoto: PhotoMeta = {
  id: "photo-1",
  name: "storefront.jpg",
  type: "image/jpeg",
  sizeBytes: 123_456,
  width: 800,
  height: 600,
  sha256: "ab".repeat(32),
};

describe("customer draft", () => {
  it("starts on the default template with its default colours and no photo", () => {
    const draft = defaultDraft();
    expect(draft.version).toBe(2);
    expect(draft.templateId).toBe("channelLetters");
    expect(draft.text).toBe("");
    expect(draft.colours.face).toBe("warmWhite");
    expect(draft.colours.glow).toBe("azure");
    expect(draft.photo).toBeNull();
    expect(draft.selection).toBeNull();
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
    expect(parseDraft('{"version":3,"templateId":"neonScript"}')).toBeNull();
    expect(parseDraft('{"version":1,"templateId":"nope"}')).toBeNull();
    expect(parseDraft('{"version":2,"templateId":"nope"}')).toBeNull();
    // Invalid colour ids for a declared slot are refused, not ignored.
    expect(
      parseDraft('{"version":2,"templateId":"neonScript","colours":{"face":"chartreuse"}}'),
    ).toBeNull();
    expect(
      parseDraft(
        '{"version":2,"templateId":"neonScript","colours":{"face":"rose","glow":"chartreuse"}}',
      ),
    ).toBeNull();
    // Missing slots fall back to the template defaults.
    const partial = parseDraft('{"version":2,"templateId":"neonScript","colours":{"face":"rose"}}');
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

describe("draft version 1 migration", () => {
  it("accepts a version 1 draft and migrates it to version 2", () => {
    const v1 = JSON.stringify({
      version: 1,
      templateId: "neonScript",
      text: "Lumière",
      tagline: "",
      colours: { face: "rose", glow: "violet", accent: "azure" },
    });
    const parsed = parseDraft(v1);
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(2);
    expect(parsed?.templateId).toBe("neonScript");
    expect(parsed?.text).toBe("Lumière");
    expect(parsed?.photo).toBeNull();
    expect(parsed?.selection).toBeNull();
    // The migrated draft serialises as version 2.
    expect(JSON.parse(serializeDraft(parsed!)).version).toBe(2);
  });

  it("refuses a version 1 draft with an unknown template", () => {
    expect(parseDraft('{"version":1,"templateId":"nope"}')).toBeNull();
  });
});

describe("draft photo and selection", () => {
  it("round-trips photo metadata and a normalised selection", () => {
    const draft = {
      ...defaultDraft(),
      photo: samplePhoto,
      selection: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
    };
    expect(parseDraft(serializeDraft(draft))).toEqual(draft);
  });

  it("refuses drafts with malformed photo metadata", () => {
    const base = { ...defaultDraft(), photo: samplePhoto };
    const bad = [
      { ...samplePhoto, id: "" },
      { ...samplePhoto, type: "image/gif" },
      { ...samplePhoto, type: "text/plain" },
      { ...samplePhoto, sizeBytes: -1 },
      { ...samplePhoto, sizeBytes: 1.5 },
      { ...samplePhoto, width: 0 },
      { ...samplePhoto, width: 800.5 },
      { ...samplePhoto, sha256: "not-a-hash" },
      { ...samplePhoto, sha256: "AB".repeat(32) },
    ];
    for (const photo of bad) {
      expect(parseDraft(serializeDraft({ ...base, photo })), photo.type).toBeNull();
    }
  });

  it("refuses drafts with malformed selections and clamps out-of-range ones", () => {
    const withPhoto = { ...defaultDraft(), photo: samplePhoto };
    const wrongType = JSON.stringify({
      ...JSON.parse(serializeDraft(withPhoto)),
      selection: { x: "0.1", y: 0, width: 0.5, height: 0.5 },
    });
    expect(parseDraft(wrongType)).toBeNull();
    expect(
      parseDraft(
        serializeDraft({ ...withPhoto, selection: { x: 0, y: 0, width: Number.NaN, height: 0.5 } }),
      ),
    ).toBeNull();

    const clamped = parseDraft(
      serializeDraft({ ...withPhoto, selection: { x: -0.5, y: 0.9, width: 2, height: 0.001 } }),
    );
    expect(clamped?.selection).toEqual({ x: 0, y: 0.9, width: 1, height: MIN_SELECTION });
  });

  it("changing the photo drops the selection", () => {
    const draft = {
      ...defaultDraft(),
      photo: samplePhoto,
      selection: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
    };
    const replaced = draftWithPhoto(draft, { ...samplePhoto, id: "photo-2" });
    expect(replaced.photo?.id).toBe("photo-2");
    expect(replaced.selection).toBeNull();

    const removed = draftWithPhoto(draft, null);
    expect(removed.photo).toBeNull();
    expect(removed.selection).toBeNull();
  });

  it("ignores a selection when there is no photo", () => {
    const draft = draftWithSelection(defaultDraft(), { x: 0.1, y: 0.1, width: 0.5, height: 0.5 });
    expect(draft.selection).toBeNull();
  });

  it("clamps selections set on a photo and clears them", () => {
    const withPhoto = draftWithPhoto(defaultDraft(), samplePhoto);
    const selected = draftWithSelection(withPhoto, { x: 0.75, y: -0.2, width: 0.9, height: 0.3 });
    expect(selected.selection).toEqual({ x: 0.75, y: 0, width: 0.25, height: 0.3 });

    expect(clearSelection(selected).selection).toBeNull();
  });

  it("clampRect keeps rectangles inside the photo with a minimum size", () => {
    expect(clampRect({ x: 0.5, y: 0.5, width: 0.25, height: 0.25 })).toEqual({
      x: 0.5,
      y: 0.5,
      width: 0.25,
      height: 0.25,
    });
    expect(clampRect({ x: 0.99, y: 0.99, width: 0.5, height: 0.5 })).toEqual({
      x: 1 - MIN_SELECTION,
      y: 1 - MIN_SELECTION,
      width: MIN_SELECTION,
      height: MIN_SELECTION,
    });
    expect(clampRect({ x: 0, y: 0, width: 0.001, height: 0.001 })).toEqual({
      x: 0,
      y: 0,
      width: MIN_SELECTION,
      height: MIN_SELECTION,
    });
  });
});
