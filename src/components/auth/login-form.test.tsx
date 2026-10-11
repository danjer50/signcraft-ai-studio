import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthApiError } from "@/lib/auth-client";
import { getMessages } from "@/i18n/get-messages";

import { LoginForm } from "./login-form";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const loginMock = vi.fn();
const redeemMock = vi.fn();
vi.mock("@/lib/auth-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth-client")>();
  return {
    ...original,
    loginWithPassword: (...args: unknown[]) => loginMock(...args),
    redeemAccessCode: (...args: unknown[]) => redeemMock(...args),
  };
});

const messages = getMessages("en");
const copy = messages.auth.login;

function renderForm() {
  return render(<LoginForm locale="en" messages={messages} />);
}

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(copy.email), email);
  await userEvent.type(screen.getByLabelText(copy.password), password);
  await userEvent.click(screen.getByRole("button", { name: copy.submit }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    redeemMock.mockReset();
  });

  it("renders the shared login form", () => {
    renderForm();
    expect(screen.getByRole("heading", { level: 1, name: copy.title })).toBeInTheDocument();
    expect(screen.getByLabelText(copy.email)).toBeInTheDocument();
    expect(screen.getByLabelText(copy.password)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.submit })).toBeInTheDocument();
  });

  it("rejects a too-short password client-side, without calling the API", async () => {
    renderForm();
    await fillAndSubmit("admin@studio.test", "short");
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.passwordTooShort);
    expect(loginMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects an admin to the Admin Space after a successful login", async () => {
    loginMock.mockResolvedValue({ id: "a1", email: "admin@studio.test", role: "admin" });
    renderForm();
    await fillAndSubmit("admin@studio.test", "a-valid-password");
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/en/admin"));
  });

  it("redirects a professional to the Pro Studio after a successful login", async () => {
    loginMock.mockResolvedValue({ id: "p1", email: "pro@studio.test", role: "pro" });
    renderForm();
    await fillAndSubmit("pro@studio.test", "a-valid-password");
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/en/studio"));
  });

  it("shows the server's localised error when the API rejects the login", async () => {
    loginMock.mockRejectedValue(new AuthApiError(401, "invalid_credentials", "nope"));
    renderForm();
    await fillAndSubmit("admin@studio.test", "a-valid-password");
    expect(await screen.findByRole("alert")).toHaveTextContent("nope");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("offers the Pro access-code entry next to the password form", () => {
    renderForm();
    const codeForm = screen.getByTestId("access-code-form");
    expect(codeForm).toBeInTheDocument();
    expect(
      within(codeForm).getByPlaceholderText(messages.auth.codes.placeholder),
    ).toBeInTheDocument();
    expect(
      within(codeForm).getByRole("button", { name: messages.auth.codes.submit }),
    ).toBeInTheDocument();
  });

  it("redeeming a valid access code opens the Pro Workspace", async () => {
    redeemMock.mockResolvedValue({ id: "c1", email: "pro-x@access.signcraft.local", role: "pro" });
    renderForm();
    const codeForm = screen.getByTestId("access-code-form");
    await userEvent.type(
      within(codeForm).getByPlaceholderText(messages.auth.codes.placeholder),
      "SC-7K2M-9QRT",
    );
    await userEvent.click(
      within(codeForm).getByRole("button", { name: messages.auth.codes.submit }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/en/studio"));
    expect(redeemMock).toHaveBeenCalledWith("en", "SC-7K2M-9QRT");
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("shows the localised error when the access code is refused", async () => {
    redeemMock.mockRejectedValue(new AuthApiError(401, "invalid_code", "bad code"));
    renderForm();
    const codeForm = screen.getByTestId("access-code-form");
    await userEvent.type(
      within(codeForm).getByPlaceholderText(messages.auth.codes.placeholder),
      "SC-AAAA-BBBB",
    );
    await userEvent.click(
      within(codeForm).getByRole("button", { name: messages.auth.codes.submit }),
    );
    expect(await within(codeForm).findByRole("alert")).toHaveTextContent("bad code");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
