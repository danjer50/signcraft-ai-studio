/**
 * Client-side photo validation for the customer storefront upload. Everything here
 * is a pure function so it is unit-testable without a browser. Validation is by
 * magic bytes, never by file extension or Content-Type: both are trivially spoofed.
 */

export const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
export const MAX_PHOTO_SIDE_PIXELS = 4096;

export type ImageKind = "jpeg" | "png" | "webp";

export const IMAGE_MIME: Record<ImageKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type PhotoError = "type" | "size" | "dimensions" | "unreadable";

/** Detects the image kind from the first bytes of the file. */
export function sniffImageKind(head: Uint8Array): ImageKind | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "jpeg";
  }
  if (
    head.length >= 8 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a
  ) {
    return "png";
  }
  if (
    head.length >= 12 &&
    head[0] === 0x52 && // R
    head[1] === 0x49 && // I
    head[2] === 0x46 && // F
    head[3] === 0x46 && // F
    head[8] === 0x57 && // W
    head[9] === 0x45 && // E
    head[10] === 0x42 && // B
    head[11] === 0x50 // P
  ) {
    return "webp";
  }
  return null;
}

/** Enforces the file-size cap. Returns the error code, or null when acceptable. */
export function checkPhotoSize(sizeBytes: number): "size" | null {
  return sizeBytes > MAX_PHOTO_BYTES ? "size" : null;
}

/**
 * Enforces the pixel cap per side. Besides the memory bound, this mitigates decode
 * bombs: a small file can still decode to a huge bitmap. Returns the error code, or
 * null when acceptable.
 */
export function checkPhotoDimensions(width: number, height: number): "dimensions" | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "dimensions";
  }
  return width > MAX_PHOTO_SIDE_PIXELS || height > MAX_PHOTO_SIDE_PIXELS ? "dimensions" : null;
}
