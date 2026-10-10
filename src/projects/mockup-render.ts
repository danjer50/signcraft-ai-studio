import type {
  ColourRole,
  LayoutId,
  MockupStyle,
  NormalizedRect,
  SignTemplate,
} from "@/templates/types";

import type { StoredPhoto } from "./photo-store";

/**
 * The client-side visual mockup renderer (Milestone 4, Approach A). It composites a
 * basic visual mockup entirely in the browser: the sign — business name and optional
 * tagline — painted in the selected template's style and colours, placed flat and
 * axis-aligned inside the marked area on the customer's photo.
 *
 * Honesty contract: there is NO perspective transform, NO environmental lighting and
 * NO cast shadows. The glow of some templates is part of the chosen sign style, not a
 * lighting simulation. The result is not fabrication-ready; the UI labels it as such.
 *
 * Everything stays on the device: the photo is decoded from the in-memory store, the
 * canvas is not tainted (`blob:` URLs are same-origin), so PNG export works with no
 * proxy and no network. No dependencies, no keys, no paid services.
 */

/** Output cap: the longest side of the mockup canvas, in pixels (memory bound). */
export const MOCKUP_MAX_SIZE = 1600;

/** Minimum interval between two renders, in milliseconds (low-end phone guard). */
export const MIN_RENDER_INTERVAL_MS = 1000;

/**
 * Layouts whose preview uppercases the sign text (sign-preview.module.css). The mockup
 * applies the same transform so the mockup matches the preview.
 */
const UPPERCASE_LAYOUTS: ReadonlySet<LayoutId> = new Set([
  "blade",
  "band",
  "vinyl",
  "plaque",
  "marquee",
  "totem",
]);

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** A canvas factory, injectable so unit tests can run without a real 2d context. */
export type CanvasFactory = () => HTMLCanvasElement;

/** An image loader, injectable so unit tests can skip real decoding. */
export type ImageLoader = (blob: Blob) => Promise<HTMLImageElement>;

export type MockupInput = {
  /** The stored storefront photo; its pixels never leave the device. */
  photo: StoredPhoto;
  /** The marked sign area, normalised to the photo's natural size. */
  selection: NormalizedRect;
  /** The sign's business name; the caller passes the localised fallback when empty. */
  text: string;
  /** Optional tagline, drawn beneath the name. */
  tagline: string;
  /** The selected template: layout (uppercase) and mockup style. */
  template: SignTemplate;
  /** Resolved hex values per colour role (face, glow, accent). */
  colours: Record<ColourRole, string>;
  /** Output cap; defaults to MOCKUP_MAX_SIZE. */
  maxSize?: number;
  /** Injectable for tests. */
  createCanvas?: CanvasFactory;
  loadImage?: ImageLoader;
};

export type MockupSuccess = {
  ok: true;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

export type MockupFailure = { ok: false; error: "unsupported" | "decode" | "render" };

export type MockupResult = MockupSuccess | MockupFailure;

function defaultLoadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The image could not be decoded"));
    };
    image.src = url;
  });
}

function defaultCreateCanvas(): HTMLCanvasElement {
  return document.createElement("canvas");
}

/** Mixes a hex colour towards white; used for the brushed-metal gradient top stop. */
export function mixHexTowardsWhite(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const channel = (index: number) => {
    const base = parseInt(full.slice(index * 2, index * 2 + 2), 16);
    if (Number.isNaN(base)) {
      return 0;
    }
    return Math.round(base + (255 - base) * amount);
  };
  return `#${[channel(0), channel(1), channel(2)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: MockupStyle["board"],
  rect: { x: number; y: number; width: number; height: number },
  colours: Record<ColourRole, string>,
): void {
  if (board === "none") {
    return;
  }
  const radius = Math.min(rect.width, rect.height) * 0.08;
  const border = Math.max(2, Math.min(rect.width, rect.height) * 0.018);
  roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  if (board === "glowPanel") {
    // The halo is part of the sign's own light, not environmental lighting.
    ctx.shadowColor = colours.glow;
    ctx.shadowBlur = Math.min(rect.width, rect.height) * 0.1;
    ctx.fillStyle = "rgba(11, 18, 25, 0.94)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = colours.glow;
  } else {
    ctx.fillStyle = "rgba(16, 23, 31, 0.93)";
    ctx.fill();
    ctx.strokeStyle = colours.accent;
  }
  ctx.lineWidth = border;
  ctx.stroke();
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT_STACK}`;
}

/**
 * Shrinks the font until the line fits the available width, bounded below by a
 * minimum size. The loop is geometric, so it always terminates quickly.
 */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  line: string,
  weight: number,
  availableWidth: number,
  availableHeight: number,
): number {
  const minFont = Math.max(9, availableHeight * 0.12);
  let size = availableHeight * 0.62;
  ctx.font = font(weight, size);
  while (ctx.measureText(line).width > availableWidth && size > minFont) {
    size = Math.max(minFont, size * 0.9);
    ctx.font = font(weight, size);
  }
  return size;
}

function paintText(
  ctx: CanvasRenderingContext2D,
  treatment: MockupStyle["text"],
  line: string,
  centre: { x: number; y: number },
  size: number,
  colours: Record<ColourRole, string>,
): void {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (treatment === "glow") {
    ctx.shadowColor = colours.glow;
    ctx.shadowBlur = size * 0.4;
    ctx.fillStyle = colours.face;
    ctx.font = font(700, size);
    ctx.fillText(line, centre.x, centre.y);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    return;
  }
  if (treatment === "gradient") {
    const gradient = ctx.createLinearGradient(0, centre.y - size * 0.6, 0, centre.y + size * 0.6);
    gradient.addColorStop(0, mixHexTowardsWhite(colours.face, 0.45));
    gradient.addColorStop(1, colours.face);
    ctx.fillStyle = gradient;
    ctx.font = font(800, size);
    ctx.fillText(line, centre.x, centre.y);
    return;
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = colours.face;
  ctx.font = font(treatment === "band" ? 800 : 600, size);
  ctx.fillText(line, centre.x, centre.y);
}

/**
 * Renders the mockup. Pure apart from the injected canvas/image factories: no state,
 * no network, no globals mutated. Returns a typed failure instead of throwing —
 * "unsupported" (no 2d context), "decode" (the photo could not be decoded) or
 * "render" (anything else).
 */
export async function renderMockup(input: MockupInput): Promise<MockupResult> {
  const maxSize = input.maxSize ?? MOCKUP_MAX_SIZE;
  const createCanvas = input.createCanvas ?? defaultCreateCanvas;
  const loadImage = input.loadImage ?? defaultLoadImage;
  let image: HTMLImageElement;
  try {
    image = await loadImage(input.photo.blob);
  } catch {
    return { ok: false, error: "decode" };
  }
  try {
    const naturalWidth = image.naturalWidth || input.photo.meta.width;
    const naturalHeight = image.naturalHeight || input.photo.meta.height;
    if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight)) {
      return { ok: false, error: "decode" };
    }

    const scale = Math.min(1, maxSize / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));

    const canvas = createCanvas();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, error: "unsupported" };
    }

    ctx.drawImage(image, 0, 0, width, height);

    // The selection is normalised to the natural size: convert to output pixels.
    const rect = {
      x: input.selection.x * width,
      y: input.selection.y * height,
      width: input.selection.width * width,
      height: input.selection.height * height,
    };

    drawBoard(ctx, input.template.mockup.board, rect, input.colours);

    const padX = Math.max(4, rect.width * 0.08);
    const padY = Math.max(4, rect.height * 0.08);
    const inner = {
      x: rect.x + padX,
      y: rect.y + padY,
      width: rect.width - padX * 2,
      height: rect.height - padY * 2,
    };

    const uppercase = UPPERCASE_LAYOUTS.has(input.template.layout);
    const name = uppercase ? input.text.toUpperCase() : input.text;
    const tagline = uppercase ? input.tagline.toUpperCase() : input.tagline;

    const hasTagline = tagline.trim().length > 0;
    const nameHeight = hasTagline ? inner.height * 0.72 : inner.height;
    const taglineHeight = hasTagline ? inner.height * 0.28 : 0;
    const nameCentre = { x: inner.x + inner.width / 2, y: inner.y + nameHeight / 2 };
    const taglineCentre = {
      x: inner.x + inner.width / 2,
      y: inner.y + nameHeight + taglineHeight / 2,
    };

    const nameSize = fitFontSize(
      ctx,
      name,
      input.template.mockup.text === "band" ? 800 : 600,
      inner.width,
      nameHeight,
    );
    paintText(ctx, input.template.mockup.text, name, nameCentre, nameSize, input.colours);

    if (hasTagline) {
      const taglineSize = Math.max(9, nameSize * 0.3);
      ctx.fillStyle = input.colours.accent;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = font(600, taglineSize);
      ctx.fillText(tagline, taglineCentre.x, taglineCentre.y);
    }

    return { ok: true, canvas, width, height };
  } catch {
    return { ok: false, error: "render" };
  }
}

/** Encodes a rendered mockup canvas as a PNG Blob (same-origin: the canvas is not tainted). */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("The mockup could not be encoded"));
      }
    }, "image/png");
  });
}
