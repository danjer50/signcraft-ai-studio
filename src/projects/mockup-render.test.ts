import { describe, expect, it, vi } from "vitest";

import { getTemplate } from "@/templates/catalogue";
import type { ColourRole, NormalizedRect, SignTemplate } from "@/templates/types";

import {
  canvasToPngBlob,
  MOCKUP_MAX_SIZE,
  mixHexTowardsWhite,
  renderMockup,
  type MockupInput,
} from "./mockup-render";
import type { StoredPhoto } from "./photo-store";

/**
 * happy-dom has no 2d canvas, so the renderer is tested with an injected canvas
 * factory and image loader. The mock context records every call and measures text
 * as `length * fontSize * 0.5`, which is enough to verify the draw sequence, the
 * selection-rect math, the shrink-to-fit loop and the per-template treatments.
 */

type RecordedCall = { name: string; args: unknown[] };

function createMockContext() {
  const calls: RecordedCall[] = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    shadowColor: "transparent",
    shadowBlur: 0,
    drawImage: vi.fn((...args: unknown[]) => calls.push({ name: "drawImage", args })),
    beginPath: vi.fn(() => calls.push({ name: "beginPath", args: [] })),
    moveTo: vi.fn((...args: unknown[]) => calls.push({ name: "moveTo", args })),
    lineTo: vi.fn((...args: unknown[]) => calls.push({ name: "lineTo", args })),
    arcTo: vi.fn((...args: unknown[]) => calls.push({ name: "arcTo", args })),
    closePath: vi.fn(() => calls.push({ name: "closePath", args: [] })),
    fill: vi.fn(() => calls.push({ name: "fill", args: [] })),
    stroke: vi.fn(() => calls.push({ name: "stroke", args: [] })),
    fillText: vi.fn((...args: unknown[]) => calls.push({ name: "fillText", args })),
    measureText: vi.fn((text: string) => {
      const size = Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 10);
      return { width: text.length * size * 0.5 };
    }),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  };
  return { ctx, calls };
}

const photo: StoredPhoto = {
  meta: {
    id: "photo-1",
    name: "storefront.jpg",
    type: "image/jpeg",
    sizeBytes: 1000,
    width: 800,
    height: 600,
    sha256: "ab".repeat(32),
  },
  blob: new Blob(["jpeg-bytes"], { type: "image/jpeg" }),
  objectUrl: "blob:photo-1",
};

const colours: Record<ColourRole, string> = {
  face: "#fdeecf",
  glow: "#7dd3fc",
  accent: "#22d3ee",
};

const selection: NormalizedRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

function setup(overrides: Partial<MockupInput> & { template?: SignTemplate } = {}) {
  const { ctx, calls } = createMockContext();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn(),
  };
  const image = { naturalWidth: 800, naturalHeight: 600 } as HTMLImageElement;
  const input: MockupInput = {
    photo,
    selection,
    text: "Studio",
    tagline: "",
    template: overrides.template ?? getTemplate("channelLetters"),
    colours,
    createCanvas: () => canvas as unknown as HTMLCanvasElement,
    loadImage: async () => image,
    ...overrides,
  };
  return { input, ctx, calls, canvas, image };
}

function fillTextCalls(calls: RecordedCall[]) {
  return calls.filter((call) => call.name === "fillText");
}

describe("renderMockup", () => {
  it("draws the photo at its natural size when it fits the cap", async () => {
    const { input, calls, canvas } = setup();
    const result = await renderMockup(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    const drawImage = calls.find((call) => call.name === "drawImage");
    expect(drawImage?.args.slice(1)).toEqual([0, 0, 800, 600]);
  });

  it("caps the longest side at MOCKUP_MAX_SIZE", async () => {
    const { input } = setup({
      loadImage: async () => ({ naturalWidth: 3200, naturalHeight: 2400 }) as HTMLImageElement,
    });
    const result = await renderMockup(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.width).toBe(MOCKUP_MAX_SIZE);
    expect(result.height).toBe(1200);
  });

  it("places the sign text at the centre of the marked area", async () => {
    const { input, calls } = setup();
    const result = await renderMockup(input);
    expect(result.ok).toBe(true);
    // Selection 0.25..0.75 of an 800×600 photo → rect (200, 150, 400, 300);
    // padding is symmetric, so the text centre is the rect centre (400, 300).
    const texts = fillTextCalls(calls);
    expect(texts).toHaveLength(1);
    expect(texts[0]?.args[0]).toBe("Studio");
    expect(texts[0]?.args[1]).toBe(400);
    expect(texts[0]?.args[2]).toBe(300);
  });

  it("shrinks the font until the text fits the marked area", async () => {
    const longName = "A".repeat(64);
    const { input, ctx, calls } = setup({ text: longName });
    const result = await renderMockup(input);
    expect(result.ok).toBe(true);
    // Available width: 400 - 2 × max(4, 400 × 0.08) = 336. The mock measures
    // 64 chars at 0.5 × size, so the loop must land on the minimum font size
    // (max(9, 252 × 0.12) = 30.24) and the recorded font must reflect it.
    const texts = fillTextCalls(calls);
    expect(texts).toHaveLength(1);
    expect(ctx.font).toMatch(/30\.24px/);
  });

  it("uppercases the text for the layouts whose preview is uppercase", async () => {
    const { input, calls } = setup({
      text: "café",
      tagline: "boulangerie",
      template: getTemplate("projectingBlade"),
    });
    const result = await renderMockup(input);
    expect(result.ok).toBe(true);
    const texts = fillTextCalls(calls);
    expect(texts.map((call) => call.args[0])).toEqual(["CAFÉ", "BOULANGERIE"]);
  });

  it("keeps the case for the layouts whose preview is not uppercase", async () => {
    const { input, calls } = setup({
      text: "Café",
      tagline: "Boulangerie",
      template: getTemplate("neonScript"),
    });
    await renderMockup(input);
    const texts = fillTextCalls(calls);
    expect(texts.map((call) => call.args[0])).toEqual(["Café", "Boulangerie"]);
  });

  it("draws the tagline beneath the name in the accent colour", async () => {
    const { input, ctx, calls } = setup({ text: "Studio", tagline: "Bakery" });
    await renderMockup(input);
    const texts = fillTextCalls(calls);
    expect(texts).toHaveLength(2);
    // The tagline sits in the lower 28 % band of the inner rect.
    expect(texts[1]?.args[0]).toBe("Bakery");
    expect(texts[1]?.args[2]).toBeGreaterThan(300);
    expect(ctx.fillStyle).toBe(colours.accent);
  });

  it("skips the board for templates without one", async () => {
    const { input, calls } = setup({ template: getTemplate("windowVinyl") });
    await renderMockup(input);
    expect(calls.some((call) => call.name === "stroke")).toBe(false);
    expect(calls.some((call) => call.name === "fill")).toBe(false);
    expect(fillTextCalls(calls)).toHaveLength(1);
  });

  it("draws a glowing board for glow-panel templates", async () => {
    const { input, ctx, calls } = setup({ template: getTemplate("neonScript") });
    await renderMockup(input);
    expect(calls.some((call) => call.name === "fill")).toBe(true);
    expect(calls.some((call) => call.name === "stroke")).toBe(true);
    expect(ctx.strokeStyle).toBe(colours.glow);
  });

  it("paints gradient text for the dimensional template", async () => {
    const { input, ctx } = setup({ template: getTemplate("dimensionalMetal") });
    await renderMockup(input);
    expect(ctx.createLinearGradient).toHaveBeenCalled();
  });

  it("fails with `unsupported` when there is no 2d context", async () => {
    const { input } = setup();
    input.createCanvas = () => ({ getContext: () => null }) as unknown as HTMLCanvasElement;
    const result = await renderMockup(input);
    expect(result).toEqual({ ok: false, error: "unsupported" });
  });

  it("fails with `decode` when the photo cannot be decoded", async () => {
    const { input } = setup();
    input.loadImage = async () => {
      throw new Error("nope");
    };
    const result = await renderMockup(input);
    expect(result).toEqual({ ok: false, error: "decode" });
  });

  it("fails with `render` when the canvas factory throws", async () => {
    const { input } = setup();
    input.createCanvas = () => {
      throw new Error("no canvas");
    };
    const result = await renderMockup(input);
    expect(result).toEqual({ ok: false, error: "render" });
  });
});

describe("canvasToPngBlob", () => {
  it("resolves with the encoded PNG blob", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    const canvas = {
      toBlob: (callback: (blob: Blob | null) => void) => callback(blob),
    } as unknown as HTMLCanvasElement;
    await expect(canvasToPngBlob(canvas)).resolves.toBe(blob);
  });

  it("rejects when the encoder returns null", async () => {
    const canvas = {
      toBlob: (callback: (blob: Blob | null) => void) => callback(null),
    } as unknown as HTMLCanvasElement;
    await expect(canvasToPngBlob(canvas)).rejects.toThrow("encoded");
  });
});

describe("mixHexTowardsWhite", () => {
  it("mixes towards white by the given amount", () => {
    expect(mixHexTowardsWhite("#000000", 0.5)).toBe("#808080");
    expect(mixHexTowardsWhite("#ffffff", 0.5)).toBe("#ffffff");
    expect(mixHexTowardsWhite("#000", 0.5)).toBe("#808080");
    expect(mixHexTowardsWhite("#22d3ee", 0)).toBe("#22d3ee");
  });
});
