/**
 * Typed errors for every network failure mode. React Query decides whether to
 * retry based on these, so the distinction between "the server said no" and
 * "we never reached the server" matters.
 */

/** Strips query strings so tokens or codes never reach the log file. */
export function redactUrl(url: string): string {
  const end = url.search(/[?#]/);
  return end === -1 ? url : `${url.slice(0, end)}?…`;
}

export class NetworkError extends Error {
  constructor(
    readonly url: string,
    readonly cause?: unknown,
  ) {
    super(`Could not reach ${redactUrl(url)}`);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(
    readonly url: string,
    readonly timeout: number,
  ) {
    super(`${redactUrl(url)} did not respond within ${timeout}ms`);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
    message?: string,
  ) {
    super(message || `${redactUrl(url)} gaf status ${status}`);
    this.name = "HttpError";
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  /** The session is gone or insufficient; retrying with the same token is pointless. */
  get isAuth() {
    return this.status === 401 || this.status === 403;
  }

  /** Server-side or rate-limit failures are worth another attempt. */
  get isRetryable() {
    return this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

/** The response arrived but was not the shape we asked for (HTML error page, truncated JSON, …). */
export class ParseError extends Error {
  constructor(
    readonly url: string,
    readonly cause?: unknown,
  ) {
    super(`Unexpected response from ${redactUrl(url)}`);
    this.name = "ParseError";
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/** A bearer token was about to be sent somewhere it does not belong. */
export class InsecureRequestError extends Error {
  constructor(
    readonly url: string,
    reason: string,
  ) {
    super(`Blocked request to ${redactUrl(url)}: ${reason}`);
    this.name = "InsecureRequestError";
    Object.setPrototypeOf(this, InsecureRequestError.prototype);
  }
}

/**
 * Whether React Query should retry. Auth failures, bad requests and blocked
 * requests are permanent; transport hiccups and 5xx are not.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) return error.isRetryable;
  if (error instanceof InsecureRequestError) return false;
  if (error instanceof ParseError) return false;
  return error instanceof NetworkError || error instanceof TimeoutError;
}

/** A message safe to show in an Alert or Snackbar. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpError && error.isAuth)
    return "Je sessie is verlopen. Log opnieuw in.";
  if (error instanceof TimeoutError)
    return "De server reageert niet. Probeer het later opnieuw.";
  if (error instanceof NetworkError)
    return "Geen verbinding. Controleer je internetverbinding.";
  if (error instanceof Error) return error.message;
  return "Er is iets misgegaan";
}
