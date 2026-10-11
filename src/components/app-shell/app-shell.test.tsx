import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { AppShell } from "./app-shell";

const routing = vi.hoisted(() => ({
  pathname: "/fr",
  router: { replace: vi.fn(), push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  // NavAuth uses the router to leave a gated page after signing out.
  useRouter: () => routing.router,
}));

/**
 * Replaces matchMedia with a controllable viewport. `setDesktop(true)` fires the same
 * change event a browser fires when the window crosses the 64rem breakpoint.
 */
function mockViewport() {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let desktop = false;
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return desktop;
        },
        media: query,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
      }) as unknown as MediaQueryList,
  );
  return {
    setDesktop(next: boolean) {
      desktop = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
}

function renderShell(locale: "fr" | "en" | "ar" = "fr") {
  routing.pathname = `/${locale}`;
  return render(
    <AppShell locale={locale} messages={getMessages(locale)}>
      <p>Page body</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    routing.pathname = "/fr";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.overflow = "";
  });

  it("provides a skip link, a brand link and a main landmark", () => {
    renderShell("fr");

    expect(screen.getByRole("link", { name: "Aller au contenu" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("link", { name: /SignCraft AI Studio/ })).toHaveAttribute(
      "href",
      "/fr",
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(within(main).getByText("Page body")).toBeInTheDocument();
  });

  it("marks the current page and lists planned sections without links", () => {
    renderShell("fr");
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });

    const home = within(nav).getByRole("link", { name: "Accueil" });
    expect(home).toHaveAttribute("href", "/fr");
    expect(home).toHaveAttribute("aria-current", "page");

    const create = within(nav).getByRole("link", { name: "Créer mon enseigne" });
    expect(create).toHaveAttribute("href", "/fr/create");
    const pro = within(nav).getByRole("link", { name: "Espace professionnel" });
    expect(pro).toHaveAttribute("href", "/fr/pro");

    for (const planned of ["Projets", "Conception 2D", "Géométrie 3D", "Maquettes IA", "Exports"]) {
      expect(within(nav).queryByRole("link", { name: planned })).not.toBeInTheDocument();
      expect(within(nav).getByText(planned)).toBeInTheDocument();
    }
    expect(within(nav).getAllByText("Prévu")).toHaveLength(5);
  });

  it("links the language switcher to the same page in each language", () => {
    routing.pathname = "/fr";
    render(
      <AppShell locale="fr" messages={getMessages("fr")}>
        <p>Body</p>
      </AppShell>,
    );
    const header = screen.getByRole("banner");
    const group = within(header).getByRole("group", { name: "Langue" });

    expect(within(group).getByRole("link", { name: "Français" })).toHaveAttribute("href", "/fr");
    expect(within(group).getByRole("link", { name: "English" })).toHaveAttribute("href", "/en");
    expect(within(group).getByRole("link", { name: "العربية" })).toHaveAttribute("href", "/ar");
    expect(within(group).getByRole("link", { name: "Français" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(group).getByRole("link", { name: "العربية" })).toHaveAttribute("lang", "ar");
  });

  it("offers the language switcher in the header and at the foot of the drawer", () => {
    renderShell("fr");
    const header = screen.getByRole("banner");
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });

    const headerLinks = within(within(header).getByRole("group", { name: "Langue" })).getAllByRole(
      "link",
    );
    const drawerLinks = within(within(nav).getByRole("group", { name: "Langue" })).getAllByRole(
      "link",
    );
    expect(headerLinks.map((link) => link.getAttribute("href"))).toEqual(["/fr", "/en", "/ar"]);
    expect(drawerLinks.map((link) => link.getAttribute("href"))).toEqual(["/fr", "/en", "/ar"]);
    expect(within(nav).getByText("Langue")).toBeInTheDocument();
  });

  it("keeps the current path when switching language", () => {
    routing.pathname = "/en/projects/42";
    render(
      <AppShell locale="en" messages={getMessages("en")}>
        <p>Body</p>
      </AppShell>,
    );
    const header = screen.getByRole("banner");
    const group = within(header).getByRole("group", { name: "Language" });

    expect(within(group).getByRole("link", { name: "العربية" })).toHaveAttribute(
      "href",
      "/ar/projects/42",
    );
  });

  it("opens and closes the mobile navigation with the menu button", async () => {
    const user = userEvent.setup();
    renderShell("fr");
    const menuButton = screen.getByRole("button", { name: "Menu" });
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "primary-navigation");
    expect(nav).toHaveAttribute("data-open", "false");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(nav).toHaveAttribute("data-open", "true");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(nav).toHaveAttribute("data-open", "false");
  });

  it("closes the drawer on Escape and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    renderShell("fr");
    const menuButton = screen.getByRole("button", { name: "Menu" });
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });

    await user.click(menuButton);
    within(nav).getByRole("link", { name: "Accueil" }).focus();
    await user.keyboard("{Escape}");

    expect(nav).toHaveAttribute("data-open", "false");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });

  it("closes the drawer when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderShell("fr");
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(nav).toHaveAttribute("data-open", "true");

    const scrim = container.querySelector('[aria-hidden="true"][data-open="true"]');
    expect(scrim).not.toBeNull();
    await user.click(scrim as Element);
    expect(nav).toHaveAttribute("data-open", "false");
  });

  it("locks page scrolling while the drawer is open on small screens", async () => {
    mockViewport();
    const user = userEvent.setup();
    renderShell("fr");
    const menuButton = screen.getByRole("button", { name: "Menu" });

    await user.click(menuButton);
    expect(document.documentElement.style.overflow).toBe("hidden");

    await user.click(menuButton);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("closes the drawer and releases the scroll lock when the viewport becomes desktop-wide", async () => {
    const viewport = mockViewport();
    const user = userEvent.setup();
    renderShell("fr");
    const menuButton = screen.getByRole("button", { name: "Menu" });

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    act(() => viewport.setDesktop(true));

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("renders Arabic navigation labels", () => {
    renderShell("ar");
    const nav = screen.getByRole("navigation", { name: "التنقل الرئيسي" });

    expect(within(nav).getByRole("link", { name: "الرئيسية" })).toHaveAttribute("href", "/ar");
    expect(screen.getByRole("button", { name: "القائمة" })).toBeInTheDocument();
  });
});
