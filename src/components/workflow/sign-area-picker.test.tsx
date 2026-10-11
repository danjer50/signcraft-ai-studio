import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import type { StoredPhoto } from "@/projects/photo-store";
import type { NormalizedRect, PhotoMeta } from "@/templates/types";

import { SignAreaPicker } from "./sign-area-picker";

const photoMeta: PhotoMeta = {
  id: "photo-1",
  name: "storefront.jpg",
  type: "image/jpeg",
  sizeBytes: 123_456,
  width: 800,
  height: 600,
  sha256: "ab".repeat(32),
};

const storedPhoto: StoredPhoto = {
  meta: photoMeta,
  blob: new Blob(["jpeg-bytes"], { type: "image/jpeg" }),
  objectUrl: "blob:mock-storefront",
};

// The stage is laid out as a 400 × 300 box at the origin, so pointer coordinates
// map to fractions directly (x = clientX / 400, y = clientY / 300).
const STAGE_RECT = {
  left: 0,
  top: 0,
  x: 0,
  y: 0,
  right: 400,
  bottom: 300,
  width: 400,
  height: 300,
  toJSON: () => ({}),
} as DOMRect;

let rectSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(STAGE_RECT);
});

afterEach(() => {
  rectSpy.mockRestore();
});

type SetupProps = Omit<
  Parameters<typeof SignAreaPicker>[0],
  "onSelectPhoto" | "onRemovePhoto" | "onSelectionChange" | "onClearSelection"
> & {
  onSelectPhoto: Mock;
  onRemovePhoto: Mock;
  onSelectionChange: Mock;
  onClearSelection: Mock;
};

function setup(overrides: Partial<SetupProps> = {}) {
  const props: SetupProps = {
    messages: getMessages("en"),
    photo: storedPhoto,
    photoError: null,
    selection: null,
    onSelectPhoto: vi.fn(),
    onRemovePhoto: vi.fn(),
    onSelectionChange: vi.fn(),
    onClearSelection: vi.fn(),
    ...overrides,
  };
  const utils = render(<SignAreaPicker {...props} />);
  // The stage only exists once a photo is held; look it up lazily per test.
  const stage = () => screen.getByRole("group", { name: /Sign placement area/ });
  return { props, stage, ...utils };
}

const SELECTION: NormalizedRect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 };

describe("SignAreaPicker", () => {
  it("shows the empty state with the upload control before a photo is chosen", () => {
    setup({ photo: null });
    expect(screen.getByText("Your storefront photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload a photo" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows the photo and the drawing hint once uploaded", () => {
    setup();
    expect(screen.getByRole("img", { name: "Photo of your storefront" })).toHaveAttribute(
      "src",
      "blob:mock-storefront",
    );
    expect(
      screen.getByText(/Drag on the photo to mark where the sign should appear/),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Mark a default area" })).toBeInTheDocument();
  });

  it("draws a selection by dragging on the photo", () => {
    const { props, stage: stageFn } = setup();
    fireEvent.pointerDown(stageFn(), { clientX: 40, clientY: 30, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 200, clientY: 150, pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(props.onSelectionChange).toHaveBeenCalledWith({
      x: 0.1,
      y: 0.1,
      width: 0.4,
      height: 0.4,
    });
  });

  it("clears the selection when a new draw starts outside it", () => {
    const { props, stage: stageFn } = setup({ selection: SELECTION });
    fireEvent.pointerDown(stageFn(), { clientX: 390, clientY: 290, pointerId: 1 });
    expect(props.onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("moves the selection by dragging inside it", () => {
    const { props, stage: stageFn } = setup({ selection: SELECTION });
    fireEvent.pointerDown(stageFn(), { clientX: 120, clientY: 90, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 200, clientY: 150, pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });

    const lastCall = props.onSelectionChange.mock.calls.at(-1)?.[0] as NormalizedRect;
    expect(lastCall.x).toBeCloseTo(0.4);
    expect(lastCall.y).toBeCloseTo(0.4);
    expect(lastCall.width).toBeCloseTo(0.4);
    expect(lastCall.height).toBeCloseTo(0.4);
  });

  it("resizes the selection by dragging a corner handle", () => {
    const { props, stage: stageFn } = setup({ selection: SELECTION });
    const handle = stageFn().querySelector('[data-handle="se"]') as HTMLElement;
    expect(handle).not.toBeNull();

    fireEvent.pointerDown(handle, { clientX: 240, clientY: 180, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 320, clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(props.onSelectionChange).toHaveBeenCalledWith({
      x: 0.2,
      y: 0.2,
      width: 0.6,
      height: 0.6,
    });
  });

  it("renders the selection with its normalised coordinates and the schematic note", () => {
    setup({ selection: SELECTION });
    const rect = document.querySelector("[data-selection]") as HTMLElement;
    expect(rect).not.toBeNull();
    expect(rect.dataset.x).toBe("0.2");
    expect(rect.dataset.width).toBe("0.4");
    expect(screen.getByText(/schematic placement — not a realistic mockup/)).toBeInTheDocument();
    expect(document.querySelectorAll("[data-handle]")).toHaveLength(8);
  });

  it("marks a default area from the button and with Enter", async () => {
    const user = userEvent.setup();
    const { props, stage: stageFn } = setup();

    await user.click(screen.getByRole("button", { name: "Mark a default area" }));
    expect(props.onSelectionChange).toHaveBeenCalledWith({
      x: 0.2,
      y: 0.3,
      width: 0.6,
      height: 0.4,
    });

    fireEvent.keyDown(stageFn(), { key: "Enter" });
    expect(props.onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it("adjusts the selection with the keyboard and clears it with Delete", () => {
    const { props, stage: stageFn } = setup({ selection: SELECTION });
    stageFn().focus();

    fireEvent.keyDown(stageFn(), { key: "ArrowRight" });
    let lastCall = props.onSelectionChange.mock.calls.at(-1)?.[0] as NormalizedRect;
    expect(lastCall.x).toBeCloseTo(0.21);
    expect(lastCall.width).toBeCloseTo(0.4);

    fireEvent.keyDown(stageFn(), { key: "ArrowDown", shiftKey: true });
    lastCall = props.onSelectionChange.mock.calls.at(-1)?.[0] as NormalizedRect;
    expect(lastCall.height).toBeCloseTo(0.41);

    fireEvent.keyDown(stageFn(), { key: "Delete" });
    expect(props.onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("clears and redraws from the action buttons", async () => {
    const user = userEvent.setup();
    const { props } = setup({ selection: SELECTION });

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(props.onClearSelection).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Redraw selection" }));
    expect(props.onClearSelection).toHaveBeenCalledTimes(2);
    // Redraw keeps the user in the drawing context.
    expect(document.activeElement).toBe(screen.getByRole("group", { name: /Sign placement area/ }));
  });

  it("announces the selection size to screen readers", () => {
    setup({ selection: SELECTION });
    expect(
      screen.getByRole("group", { name: "Sign placement area, 40 by 40 percent of the photo" }),
    ).toBeInTheDocument();
  });

  it("renders in French and Arabic", () => {
    const { unmount } = setup({ messages: getMessages("fr"), photo: null });
    expect(screen.getByText("La photo de votre devanture")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Téléverser une photo" })).toBeInTheDocument();
    unmount();

    setup({ messages: getMessages("ar"), photo: null });
    expect(screen.getByText("صورة واجهة محلك")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "رفع صورة" })).toBeInTheDocument();
    expect(screen.getByText(/ارفع صورة لواجهة محلك/)).toBeInTheDocument();
  });
});
