import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";
import { canvasToPngBlob, renderMockup } from "@/projects/mockup-render";
import type { StoredPhoto } from "@/projects/photo-store";
import { getTemplate } from "@/templates/catalogue";
import type { ColourRole, NormalizedRect } from "@/templates/types";

import { MockupPanel } from "./mockup-panel";

vi.mock("@/projects/mockup-render", () => ({
  MIN_RENDER_INTERVAL_MS: 1000,
  renderMockup: vi.fn(),
  canvasToPngBlob: vi.fn(),
}));

const renderMockupMock = vi.mocked(renderMockup);
const encodeMock = vi.mocked(canvasToPngBlob);

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

const selection: NormalizedRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

const colours: Record<ColourRole, string> = {
  face: "#fdeecf",
  glow: "#7dd3fc",
  accent: "#22d3ee",
};

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:mockup-result");
  URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  renderMockupMock.mockReset();
  encodeMock.mockReset();
});

function setup(overrides: Partial<Parameters<typeof MockupPanel>[0]> = {}) {
  const props = {
    messages: getMessages("en"),
    photo: null,
    selection: null,
    template: getTemplate("channelLetters"),
    text: "Studio",
    tagline: "",
    colours,
    lettering: "modern" as const,
    ...overrides,
  };
  render(<MockupPanel {...props} />);
  return props;
}

function readySetup(overrides: Partial<Parameters<typeof MockupPanel>[0]> = {}) {
  return setup({ photo, selection, ...overrides });
}

describe("MockupPanel", () => {
  it("renders the section, the actions and no form or submit control", () => {
    setup();
    const copy = getMessages("en").create.mockup;
    expect(screen.getByRole("heading", { name: copy.title })).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.generateCta })).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.downloadCta })).toBeTruthy();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector('button[type="submit"]')).toBeNull();
  });

  it("disables generation with an explanation when there is no photo", () => {
    setup();
    const copy = getMessages("en").create.mockup;
    const button = screen.getByRole("button", { name: copy.generateCta });
    expect(button).toHaveProperty("disabled", true);
    expect(screen.getByText(copy.disabledNoPhoto)).toBeTruthy();
  });

  it("disables generation with an explanation when there is no selection", () => {
    setup({ photo });
    const copy = getMessages("en").create.mockup;
    const button = screen.getByRole("button", { name: copy.generateCta });
    expect(button).toHaveProperty("disabled", true);
    expect(screen.getByText(copy.disabledNoSelection)).toBeTruthy();
  });

  it("renders the mockup, the honesty note and switches to the update label", async () => {
    renderMockupMock.mockResolvedValue({
      ok: true,
      canvas: {} as HTMLCanvasElement,
      width: 800,
      height: 600,
    });
    encodeMock.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const user = userEvent.setup();
    readySetup();

    const copy = getMessages("en").create.mockup;
    await user.click(screen.getByRole("button", { name: copy.generateCta }));

    const image = await screen.findByAltText(copy.mockupAlt);
    expect(image.getAttribute("src")).toBe("blob:mockup-result");
    expect(screen.getByText(copy.honestyNote)).toBeTruthy();
    // After a successful render the action becomes "Update the mockup".
    expect(screen.getByRole("button", { name: copy.regenerateCta })).toBeTruthy();
    // The download action is enabled once a mockup exists.
    expect(screen.getByRole("button", { name: copy.downloadCta })).toHaveProperty(
      "disabled",
      false,
    );
    // The renderer received the draft's content and the localised fallback for empty text.
    expect(renderMockupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        photo,
        selection,
        text: "Studio",
        tagline: "",
        colours,
      }),
    );
  });

  it("passes the localised fallback text when the business name is empty", async () => {
    renderMockupMock.mockResolvedValue({
      ok: true,
      canvas: {} as HTMLCanvasElement,
      width: 800,
      height: 600,
    });
    encodeMock.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const user = userEvent.setup();
    const messages = getMessages("en");
    readySetup({ messages, text: "   " });
    await user.click(screen.getByRole("button", { name: messages.create.mockup.generateCta }));
    await screen.findByAltText(messages.create.mockup.mockupAlt);
    expect(renderMockupMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: messages.create.previewFallback }),
    );
  });

  it("throttles overlapping renders: a second click while rendering is ignored", async () => {
    let resolveRender: (value: {
      ok: true;
      canvas: HTMLCanvasElement;
      width: number;
      height: number;
    }) => void = () => {};
    renderMockupMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRender = resolve;
        }),
    );
    encodeMock.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const user = userEvent.setup();
    const copy = getMessages("en").create.mockup;
    readySetup();

    const button = screen.getByRole("button", { name: copy.generateCta });
    await user.click(button);
    // While rendering, the button is disabled and the status is announced.
    expect(screen.getByRole("button", { name: copy.generateCta })).toHaveProperty("disabled", true);
    expect(screen.getByText(copy.rendering)).toBeTruthy();
    await user.click(button);
    expect(renderMockupMock).toHaveBeenCalledTimes(1);

    resolveRender({ ok: true, canvas: {} as HTMLCanvasElement, width: 800, height: 600 });
    await screen.findByAltText(copy.mockupAlt);
  });

  it("shows a localised error and re-enables the button when rendering fails", async () => {
    renderMockupMock.mockResolvedValue({ ok: false, error: "render" });
    const user = userEvent.setup();
    const copy = getMessages("en").create.mockup;
    readySetup();

    await user.click(screen.getByRole("button", { name: copy.generateCta }));
    expect(await screen.findByText(copy.error)).toBeTruthy();
    expect(screen.queryByAltText(copy.mockupAlt)).toBeNull();
    expect(screen.getByRole("button", { name: copy.generateCta })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("shows the unsupported message when the browser has no 2d context", async () => {
    renderMockupMock.mockResolvedValue({ ok: false, error: "unsupported" });
    const user = userEvent.setup();
    const copy = getMessages("en").create.mockup;
    readySetup();
    await user.click(screen.getByRole("button", { name: copy.generateCta }));
    expect(await screen.findByText(copy.unsupported)).toBeTruthy();
  });

  it("downloads the rendered mockup as signcraft-mockup.png", async () => {
    renderMockupMock.mockResolvedValue({
      ok: true,
      canvas: {} as HTMLCanvasElement,
      width: 800,
      height: 600,
    });
    encodeMock.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const anchors: HTMLAnchorElement[] = [];
    const originalCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      const element = originalCreate(tagName);
      if (tagName === "a") {
        anchors.push(element as HTMLAnchorElement);
      }
      return element;
    }) as typeof document.createElement);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const user = userEvent.setup();
    const copy = getMessages("en").create.mockup;
    readySetup();
    await user.click(screen.getByRole("button", { name: copy.generateCta }));
    await screen.findByAltText(copy.mockupAlt);
    await user.click(screen.getByRole("button", { name: copy.downloadCta }));

    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.download).toBe("signcraft-mockup.png");
    expect(anchors[0]?.href).toContain("blob:mockup-result");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    // The temporary anchor is removed again.
    await waitFor(() => expect(anchors[0]?.isConnected).toBe(false));
    createSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it("localises the panel, including the Arabic copy", () => {
    const messages = getMessages("ar");
    readySetup({ messages });
    const copy = messages.create.mockup;
    expect(screen.getByRole("heading", { name: copy.title })).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.generateCta })).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.downloadCta })).toBeTruthy();
  });
});
