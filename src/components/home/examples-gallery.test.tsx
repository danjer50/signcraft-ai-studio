import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { ExamplesGallery } from "./examples-gallery";

describe("ExamplesGallery", () => {
  it("shows the four example styles as illustrations", () => {
    render(<ExamplesGallery messages={getMessages("en")} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Sign styles to inspire you" }),
    ).toBeInTheDocument();

    for (const title of [
      "Illuminated letters",
      "Café and shop signs",
      "3D lettering",
      "Modern storefronts",
    ]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    }

    // Illustrative status is stated explicitly.
    expect(screen.getByText(/Illustrations of sign styles/i)).toBeInTheDocument();
  });

  it("is the in-page target of the secondary hero action", () => {
    render(<ExamplesGallery messages={getMessages("en")} />);
    expect(document.getElementById("examples")).not.toBeNull();
  });

  it("renders in French and Arabic", () => {
    const { unmount } = render(<ExamplesGallery messages={getMessages("fr")} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Lettres lumineuses" }),
    ).toBeInTheDocument();
    unmount();

    render(<ExamplesGallery messages={getMessages("ar")} />);
    expect(screen.getByRole("heading", { level: 3, name: "حروف مضيئة" })).toBeInTheDocument();
  });
});
