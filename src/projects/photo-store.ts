import type { PhotoMeta } from "@/templates/types";

import {
  checkPhotoDimensions,
  checkPhotoSize,
  IMAGE_MIME,
  type PhotoError,
  sniffImageKind,
} from "./photo-validation";

/**
 * The in-memory store for customer storefront photos. The original Blob is preserved
 * byte-for-byte — it is never re-encoded, cropped or uploaded — and is displayed
 * through an object URL that the browser decodes once. Exactly one photo is held at
 * a time; attaching a new one releases the previous object URL so memory cannot
 * grow. The serialisable identity of the photo (PhotoMeta) travels with the customer
 * draft; the pixels stay here for the session, ready for future mockup generation
 * and the Professional Studio transfer.
 */

export type StoredPhoto = {
  meta: PhotoMeta;
  blob: Blob;
  objectUrl: string;
};

const photos = new Map<string, StoredPhoto>();

export function generatePhotoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** SHA-256 of the original bytes, as lowercase hex, via the built-in WebCrypto. */
export async function sha256Hex(blob: Blob): Promise<string> {
  // arrayBuffer() first: browsers accept a Blob directly, Node's WebCrypto does not.
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Keeps the original blob under its meta id, releasing any previously held photo. */
export function attachPhoto(meta: PhotoMeta, blob: Blob): StoredPhoto {
  releaseAllPhotos();
  const objectUrl = URL.createObjectURL(blob);
  const stored: StoredPhoto = { meta, blob, objectUrl };
  photos.set(meta.id, stored);
  return stored;
}

export function getPhoto(id: string): StoredPhoto | null {
  return photos.get(id) ?? null;
}

export function releasePhoto(id: string): void {
  const stored = photos.get(id);
  if (stored) {
    URL.revokeObjectURL(stored.objectUrl);
    photos.delete(id);
  }
}

export function releaseAllPhotos(): void {
  for (const id of [...photos.keys()]) {
    releasePhoto(id);
  }
}

function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
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

export type IntakeResult = { ok: true; photo: StoredPhoto } | { ok: false; error: PhotoError };

/**
 * Validates a chosen file (magic bytes, size cap, pixel cap), measures its natural
 * dimensions, hashes the original bytes and stores the photo. Never throws: every
 * failure is a typed, localisable error.
 */
export async function intakePhoto(file: File): Promise<IntakeResult> {
  try {
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const kind = sniffImageKind(head);
    if (!kind) {
      return { ok: false, error: "type" };
    }
    const sizeError = checkPhotoSize(file.size);
    if (sizeError) {
      return { ok: false, error: sizeError };
    }

    let width: number;
    let height: number;
    try {
      const image = await loadImageElement(file);
      width = image.naturalWidth;
      height = image.naturalHeight;
    } catch {
      return { ok: false, error: "unreadable" };
    }

    const dimensionError = checkPhotoDimensions(width, height);
    if (dimensionError) {
      return { ok: false, error: dimensionError };
    }

    const sha256 = await sha256Hex(file);
    const meta: PhotoMeta = {
      id: generatePhotoId(),
      name: file.name || "photo",
      type: IMAGE_MIME[kind],
      sizeBytes: file.size,
      width,
      height,
      sha256,
    };
    return { ok: true, photo: attachPhoto(meta, file) };
  } catch {
    return { ok: false, error: "unreadable" };
  }
}
