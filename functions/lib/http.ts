import { ApiError } from "./errors";
import { errorMessage } from "./i18n";

/** Maximum accepted JSON body. Auth payloads are tiny; anything bigger is an error. */
const MAX_BODY_BYTES = 16 * 1024;

/**
 * Every auth API response is `no-store`: session state must never be cached by the
 * browser or a shared cache (security-review amendment).
 */
function withSecurityHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

export function json(data: unknown, init?: ResponseInit): Response {
  const headers = withSecurityHeaders(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorResponse(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, { status });
}

/** Reads and parses a JSON request body, rejecting oversized or malformed payloads. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new ApiError(413, "body_too_large");
  }
  let parsed: unknown;
  try {
    parsed = raw.length > 0 ? JSON.parse(raw) : {};
  } catch {
    throw new ApiError(400, "bad_request");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ApiError(400, "bad_request");
  }
  return parsed as Record<string, unknown>;
}

/** Turns a thrown value into a JSON error response, localised for the caller. */
export function handleError(error: unknown, request: Request): Response {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, errorMessage(error.code, request));
  }
  console.error("auth api error:", error);
  return errorResponse(500, "server_error", errorMessage("server_error", request));
}

/** Extracts a trimmed string field from a parsed body, or throws a 400. */
export function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "bad_request");
  }
  return value.trim();
}
