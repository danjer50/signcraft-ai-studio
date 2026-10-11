import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import type { PhotoMeta } from "@/templates/types";

import { PhotoUpload } from "./photo-upload";

const photo: PhotoMeta = {
  id: "photo-1",
  name: "storefront.jpg",
  type: "image/jpeg",
  sizeBytes: 123_456,
  width: 800,
  height: 600,
  sha256: "ab".repeat(32),
};

function setup(overrides: Partial<Parameters<typeof PhotoUpload>[0]> = {}) {
  const props = {
    messages: getMessages("en"),
    photo: null,
    error: null,
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
  render(<PhotoUpload {...props} />);
  return props;
}

describe("PhotoUpload", () => {
  it("offers an upload button and reports the chosen file", () => {
    const { onSelect } = setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.accept).toContain("image/jpeg");

    const file = new File(["jpeg-bytes"], "storefront.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("shows the current photo with its name and dimensions", () => {
    setup({ photo });
    expect(screen.getByText(/storefront\.jpg/)).toBeInTheDocument();
    expect(screen.getByText(/800 × 600/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change photo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove photo" })).toBeInTheDocument();
  });

  it("reports removal", async () => {
    const user = userEvent.setup();
    const { onRemove } = setup({ photo });
    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("shows validation errors in an alert region, in every locale", () => {
    setup({ error: "size" });
    expect(screen.getByRole("alert")).toHaveTextContent("The maximum size is 12 MB");

    setup({ messages: getMessages("fr"), error: "type" });
    expect(screen.getAllByRole("alert")[1]).toHaveTextContent("image JPEG, PNG ou WebP");

    setup({ messages: getMessages("ar"), error: "unreadable" });
    expect(screen.getAllByRole("alert")[2]).toHaveTextContent("تعذّرت قراءة هذه الصورة");
  });
});
