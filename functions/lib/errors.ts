/**
 * API errors for the auth API. Each error carries an HTTP status and a stable `code`;
 * the code is translated to the caller's locale in lib/i18n.ts, so the client always
 * shows a human message and never a raw code.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (code = "bad_request"): ApiError => new ApiError(400, code);
export const unauthorized = (code = "unauthorized"): ApiError => new ApiError(401, code);
export const forbidden = (code = "forbidden"): ApiError => new ApiError(403, code);
export const notFound = (code = "not_found"): ApiError => new ApiError(404, code);
export const conflict = (code = "conflict"): ApiError => new ApiError(409, code);
export const tooManyRequests = (code = "rate_limited"): ApiError => new ApiError(429, code);
