import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/get-messages";

import { NavAuth } from "./nav-auth";

const routing = vi.hoisted(() => ({
  pathname: "/en",
  router: { replace: vi.fn(), push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => routing.router,
}));

const getSessionMock = vi.fn();
const logoutMock = vi.fn();
vi.mock("@/lib/auth-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth-client")>();
  return {
    ...original,
    getSession: (...args: unknown[]) => getSessionMock(...args),
    logout: (...args: unknown[]) => logoutMock(...args),
  };
});

const messages = getMessages("en");
const copy = messages.auth.nav;

describe("NavAuth", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    logoutMock.mockReset();
  });

  it("shows a Sign in link when anonymous (the customer space stays free)", async () => {
    getSessionMock.mockResolvedValue({ authenticated: false });
    render(<NavAuth locale="en" messages={messages} />);
    expect(await screen.findByRole("link", { name: copy.signIn })).toHaveAttribute(
      "href",
      "/en/login",
    );
  });

  it("shows the Admin Space link and Sign out for an admin", async () => {
    getSessionMock.mockResolvedValue({
      authenticated: true,
      account: { id: "a1", email: "admin@studio.test", role: "admin" },
    });
    render(<NavAuth locale="en" messages={messages} />);
    expect(await screen.findByRole("link", { name: copy.adminSpace })).toHaveAttribute(
      "href",
      "/en/admin",
    );
    expect(screen.getByRole("button", { name: copy.signOut })).toBeInTheDocument();
  });

  it("shows the Pro Studio link for a professional", async () => {
    getSessionMock.mockResolvedValue({
      authenticated: true,
      account: { id: "p1", email: "pro@studio.test", role: "pro" },
    });
    render(<NavAuth locale="en" messages={messages} />);
    expect(await screen.findByRole("link", { name: copy.proStudio })).toHaveAttribute(
      "href",
      "/en/studio",
    );
  });

  it("signs out and returns to the Sign in link", async () => {
    getSessionMock.mockResolvedValue({
      authenticated: true,
      account: { id: "p1", email: "pro@studio.test", role: "pro" },
    });
    logoutMock.mockResolvedValue(undefined);
    render(<NavAuth locale="en" messages={messages} />);
    await userEvent.click(await screen.findByRole("button", { name: copy.signOut }));
    await waitFor(() => expect(logoutMock).toHaveBeenCalledWith("en"));
    expect(await screen.findByRole("link", { name: copy.signIn })).toBeInTheDocument();
  });
});
