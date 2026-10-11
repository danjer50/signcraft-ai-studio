import { describe, expect, it } from "vitest";

import {
  checkPhotoDimensions,
  checkPhotoSize,
  IMAGE_MIME,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_SIDE_PIXELS,
  sniffImageKind,
} from "./photo-validation";

const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_HEAD = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("sniffImageKind", () => {
  it("recognises JPEG, PNG and WebP by magic bytes", () => {
    expect(sniffImageKind(JPEG_HEAD)).toBe("jpeg");
    expect(sniffImageKind(PNG_HEAD)).toBe("png");
    expect(sniffImageKind(WEBP_HEAD)).toBe("webp");
  });

  it("rejects other content, including text files with a photo extension", () => {
    expect(sniffImageKind(new TextEncoder().encode("GIF89a........"))).toBeNull();
    expect(sniffImageKind(new TextEncoder().encode("plain text file"))).toBeNull();
    expect(sniffImageKind(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(sniffImageKind(new Uint8Array([]))).toBeNull();
  });

  it("maps every kind to a MIME type", () => {
    expect(IMAGE_MIME.jpeg).toBe("image/jpeg");
    expect(IMAGE_MIME.png).toBe("image/png");
    expect(IMAGE_MIME.webp).toBe("image/webp");
  });
});

describe("checkPhotoSize", () => {
  it("accepts files up to the cap and rejects larger ones", () => {
    expect(checkPhotoSize(0)).toBeNull();
    expect(checkPhotoSize(MAX_PHOTO_BYTES)).toBeNull();
    expect(checkPhotoSize(MAX_PHOTO_BYTES + 1)).toBe("size");
  });
});

describe("checkPhotoDimensions", () => {
  it("accepts dimensions up to the cap per side", () => {
    expect(checkPhotoDimensions(1, 1)).toBeNull();
    expect(checkPhotoDimensions(MAX_PHOTO_SIDE_PIXELS, MAX_PHOTO_SIDE_PIXELS)).toBeNull();
  });

  it("rejects oversize, zero, negative and non-finite dimensions", () => {
    expect(checkPhotoDimensions(MAX_PHOTO_SIDE_PIXELS + 1, 100)).toBe("dimensions");
    expect(checkPhotoDimensions(100, MAX_PHOTO_SIDE_PIXELS + 1)).toBe("dimensions");
    expect(checkPhotoDimensions(0, 100)).toBe("dimensions");
    expect(checkPhotoDimensions(100, -5)).toBe("dimensions");
    expect(checkPhotoDimensions(Number.NaN, 100)).toBe("dimensions");
    expect(checkPhotoDimensions(100, Number.POSITIVE_INFINITY)).toBe("dimensions");
  });
});
