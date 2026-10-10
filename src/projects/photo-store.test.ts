// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PhotoMeta } from "@/templates/types";

import {
  attachPhoto,
  generatePhotoId,
  getPhoto,
  releaseAllPhotos,
  releasePhoto,
  sha256Hex,
} from "./photo-store";

function makeMeta(overrides: Partial<PhotoMeta> = {}): PhotoMeta {
  return {
    id: overrides.id ?? generatePhotoId(),
    name: "storefront.jpg",
    type: "image/jpeg",
    sizeBytes: 1234,
    width: 800,
    height: 600,
    sha256: "a".repeat(64),
    ...overrides,
  };
}

const objectUrls: string[] = [];
let urlCounter = 0;

// The store manages object URLs; the test double records creation and revocation.
vi.stubGlobal("URL", {
  ...URL,
  createObjectURL: () => {
    const url = `blob:mock-${urlCounter++}`;
    objectUrls.push(url);
    return url;
  },
  revokeObjectURL: (url: string) => {
    const index = objectUrls.indexOf(url);
    if (index >= 0) {
      objectUrls.splice(index, 1);
    }
  },
});

afterEach(() => {
  releaseAllPhotos();
});

describe("photo store", () => {
  it("attaches, returns and releases a photo, revoking its object URL", () => {
    const meta = makeMeta();
    const stored = attachPhoto(meta, new Blob(["jpeg-bytes"]));

    expect(stored.objectUrl).toMatch(/^blob:mock-/);
    expect(getPhoto(meta.id)).toBe(stored);
    expect(objectUrls).toContain(stored.objectUrl);

    releasePhoto(meta.id);
    expect(getPhoto(meta.id)).toBeNull();
    expect(objectUrls).not.toContain(stored.objectUrl);
  });

  it("holds exactly one photo: attaching a new one releases the previous", () => {
    const first = attachPhoto(makeMeta(), new Blob(["one"]));
    const second = attachPhoto(makeMeta(), new Blob(["two"]));

    expect(getPhoto(first.meta.id)).toBeNull();
    expect(objectUrls).not.toContain(first.objectUrl);
    expect(getPhoto(second.meta.id)).toBe(second);
    expect(objectUrls).toEqual([second.objectUrl]);
  });

  it("releaseAllPhotos empties the store", () => {
    const stored = attachPhoto(makeMeta(), new Blob(["x"]));
    releaseAllPhotos();
    expect(getPhoto(stored.meta.id)).toBeNull();
    expect(objectUrls).toEqual([]);
  });

  it("releasePhoto is safe for unknown ids", () => {
    expect(() => releasePhoto("does-not-exist")).not.toThrow();
  });

  it("generates unique photo ids", () => {
    expect(generatePhotoId()).not.toBe(generatePhotoId());
  });

  it("hashes blob bytes to a stable lowercase hex SHA-256", async () => {
    const blob = new Blob(["hello"]);
    const hash = await sha256Hex(blob);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // SHA-256 of "hello", well-known digest.
    expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    expect(await sha256Hex(new Blob(["hello"]))).toBe(hash);
    expect(await sha256Hex(new Blob(["world"]))).not.toBe(hash);
  });
});
