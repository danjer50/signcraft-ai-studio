// @vitest-environment node

import { describe, expect, it } from "vitest";

import { ApiError } from "./errors";
import { assertSameOrigin } from "./origin";

function requestWith(headers: Record<string, string>, url = "https://studio.test/api/auth/login") {
  return new Request(url, { method: "POST", headers });
}

describe("assertSameOrigin", () => {
  it("accepts a same-origin browser request", () => {
    expect(() =>
      assertSameOrigin(
        requestWith({ origin: "https://studio.test", "sec-fetch-site": "same-origin" }),
      ),
    ).not.toThrow();
  });

  it("accepts requests without browser headers (curl, tests)", () => {
    expect(() => assertSameOrigin(requestWith({}))).not.toThrow();
  });

  it("rejects Sec-Fetch-Site: cross-site even with a matching Origin", () => {
    expect(() =>
      assertSameOrigin(
        requestWith({ origin: "https://studio.test", "sec-fetch-site": "cross-site" }),
      ),
    ).toThrow(ApiError);
  });

  it("rejects a foreign Origin", () => {
    expect(() => assertSameOrigin(requestWith({ origin: "https://evil.example" }))).toThrow(
      ApiError,
    );
  });

  it("rejects a malformed Origin", () => {
    expect(() => assertSameOrigin(requestWith({ origin: "not a url" }))).toThrow(ApiError);
  });

  it("compares hosts, not schemes (proxies and dev stacks rewrite same-host schemes)", () => {
    // The worker may see http while the browser used https (TLS-terminating proxy).
    expect(() =>
      assertSameOrigin(
        requestWith({ origin: "https://studio.test" }, "http://studio.test/api/auth/login"),
      ),
    ).not.toThrow();
  });

  it("accepts a proxy that preserves the Host (TLS terminated at the proxy)", () => {
    expect(() =>
      assertSameOrigin(
        requestWith(
          {
            origin: "https://3000-preview.example.e2b.app",
            "x-forwarded-proto": "https",
          },
          "http://3000-preview.example.e2b.app/api/auth/login",
        ),
      ),
    ).not.toThrow();
  });

  it("accepts a proxy that rewrites the Host (X-Forwarded-Host)", () => {
    expect(() =>
      assertSameOrigin(
        requestWith(
          {
            origin: "https://3000-preview.example.e2b.app",
            "x-forwarded-proto": "https",
            "x-forwarded-host": "3000-preview.example.e2b.app",
          },
          "http://localhost:3000/api/auth/login",
        ),
      ),
    ).not.toThrow();
  });

  it("still rejects a foreign Origin behind proxy headers", () => {
    expect(() =>
      assertSameOrigin(
        requestWith(
          {
            origin: "https://evil.example",
            "x-forwarded-proto": "https",
            "x-forwarded-host": "3000-preview.example.e2b.app",
          },
          "http://localhost:3000/api/auth/login",
        ),
      ),
    ).toThrow(ApiError);
  });

  it("still rejects a foreign Origin when the Host header is preserved", () => {
    expect(() =>
      assertSameOrigin(
        requestWith(
          { origin: "https://evil.example" },
          "http://3000-preview.example.e2b.app/api/auth/login",
        ),
      ),
    ).toThrow(ApiError);
  });
});
