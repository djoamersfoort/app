import { Alert } from "react-native";

/** Strips query strings so tokens or codes never reach the log file. */
export function redactUrl(url: string): string {
  const end = url.search(/[?#]/);
  return end === -1 ? url : `${url.slice(0, end)}?…`;
}

/**
 * Only failures a retry could plausibly fix get their own type; everything else
 * throws a plain Error, which {@link isRetryableError} treats as permanent.
 */
export class NetworkError extends Error {
  constructor(url: string) {
    super(`Could not reach ${redactUrl(url)}`);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`${redactUrl(url)} did not respond within ${timeout}ms`);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
    message?: string,
  ) {
    super(message || `${redactUrl(url)} returned status ${status}`);
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

export function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) return error.isRetryable;
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

/**
 * Announces a failure to the user. Mutations declare this in their `onError`,
 * so call sites can fire and forget instead of wrapping every `mutateAsync` in
 * the same try/catch.
 */
export function showError(title: string, error: unknown) {
  Alert.alert(title, errorMessage(error));
}
