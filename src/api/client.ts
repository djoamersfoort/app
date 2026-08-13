import logging from "../logging";
import {
  HttpError,
  InsecureRequestError,
  NetworkError,
  ParseError,
  TimeoutError,
  redactUrl,
} from "./errors";

export const DEFAULT_TIMEOUT_MS = 15_000;
/** Uploads move real bytes over mobile connections, so they get their own budget. */
export const UPLOAD_TIMEOUT_MS = 120_000;

const MAX_ERROR_BODY = 512;

/**
 * Returns a bearer token. Called with `force` after a 401 so the caller can
 * bypass its cache and mint a fresh token before we give up on the request.
 */
export type TokenProvider = (force?: boolean) => Promise<string>;

export interface RequestOptions extends Omit<RequestInit, "signal"> {
  /** Aborts and rejects with TimeoutError. Defaults to {@link DEFAULT_TIMEOUT_MS}. */
  timeout?: number;
  /** Caller-owned cancellation, e.g. the signal React Query hands to a queryFn. */
  signal?: AbortSignal;
  /** When set, an Authorization header is attached and 401s trigger one retry. */
  auth?: TokenProvider;
}

function originOf(url: string): string | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)/i.exec(url);
  if (!match) return null;
  return `${match[1].toLowerCase()}://${match[2].toLowerCase()}`;
}

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1]|10\.0\.2\.2)(:\d+)?$/i;

/**
 * Refuses to send anything over a scheme that would put a bearer token on the
 * wire in cleartext. Plain http is tolerated only against a local dev server.
 */
function assertSafeUrl(url: string) {
  const origin = originOf(url);
  if (!origin)
    throw new InsecureRequestError(url, "not an absolute http(s) URL");

  const [scheme, host] = origin.split("://");
  if (scheme === "https") return;
  if (scheme === "http" && __DEV__ && LOCAL_HOSTS.test(host)) return;

  throw new InsecureRequestError(url, `scheme ${scheme} is not allowed`);
}

async function readBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, MAX_ERROR_BODY);
  } catch {
    return "";
  }
}

/** `AbortSignal.throwIfAborted` is not in every React Native runtime yet. */
function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error
    ? signal.reason
    : Object.assign(new Error("Request aborted"), { name: "AbortError" });
}

/** Pulls the human-readable bit out of the API's error envelope, if there is one. */
function messageFromBody(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.error === "string") return parsed.error;
    if (typeof parsed?.detail === "string") return parsed.detail;
    if (typeof parsed?.message === "string") return parsed.message;
    if (typeof parsed?.error_description === "string")
      return parsed.error_description;
  } catch {
    /* not JSON, fall through to the generic message */
  }
  return undefined;
}

async function send(
  url: string,
  { timeout = DEFAULT_TIMEOUT_MS, signal, auth, ...init }: RequestOptions,
  forceFresh: boolean,
): Promise<Response> {
  throwIfAborted(signal);

  const headers = new Headers(init.headers);
  if (auth) headers.set("authorization", `Bearer ${await auth(forceFresh)}`);

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      referrerPolicy: "no-referrer",
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw new TimeoutError(url, timeout);
    // A caller-initiated abort is not a failure; let React Query see it as-is.
    throwIfAborted(signal);
    throw new NetworkError(url, error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }

  // Only failures are logged: the logger rewrites its file on every call, so
  // recording every successful request would mean a disk write per request.
  if (!response.ok)
    logging.log(
      "HTTP",
      `${init.method || "GET"} ${redactUrl(url)} -> ${response.status} (${Date.now() - started}ms)`,
    );

  // Following a redirect to another host would have handed our bearer token to
  // whoever controls it. Our APIs never do this, so treat it as an attack.
  if (auth && response.url) {
    const from = originOf(url);
    const to = originOf(response.url);
    if (to && from && to !== from)
      throw new InsecureRequestError(
        url,
        `redirected to a different origin (${to})`,
      );
  }

  return response;
}

/**
 * Performs a request that is hardened by default: absolute HTTPS only, a hard
 * timeout, a single transparent retry with a freshly minted token on 401, and a
 * rejection (never a silent `undefined`) on any non-2xx status.
 */
export async function request(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  assertSafeUrl(url);

  let response = await send(url, options, false);

  // The token may have been revoked or rotated behind our back. Mint a new one
  // once before surfacing the failure.
  if (response.status === 401 && options.auth) {
    logging.log("HTTP", `401 on ${redactUrl(url)}, refreshing token`);
    response = await send(url, options, true);
  }

  if (!response.ok) {
    const body = await readBody(response);
    throw new HttpError(response.status, url, body, messageFromBody(body));
  }

  return response;
}

/** {@link request} plus a strict JSON parse; an HTML error page becomes a ParseError. */
export async function requestJson<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await request(url, {
    ...options,
    headers: { accept: "application/json", ...options.headers },
  });

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new ParseError(url, error);
  }
}

/** {@link request} for endpoints whose body we do not care about. */
export async function requestVoid(
  url: string,
  options: RequestOptions = {},
): Promise<void> {
  await request(url, options);
}

/** {@link request} for endpoints that return a document rather than JSON. */
export async function requestText(
  url: string,
  options: RequestOptions = {},
): Promise<string> {
  return (await request(url, options)).text();
}

/**
 * Escapes a value that is interpolated into a URL path. Names and ids come from
 * the API and from user input, and an unescaped `/` or `..` would silently
 * retarget the request at a different endpoint.
 */
export function segment(value: string | number): string {
  return encodeURIComponent(String(value));
}

/**
 * A `fetch`-compatible function carrying the same guards as {@link request},
 * for third-party clients (the generated media API) that insist on doing their
 * own status and body handling.
 */
export function createFetch(options: {
  auth?: TokenProvider;
  timeout?: number;
}): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    assertSafeUrl(url);

    const requestOptions: RequestOptions = {
      ...init,
      signal: init?.signal ?? undefined,
      auth: options.auth,
      timeout: options.timeout,
    };

    const response = await send(url, requestOptions, false);
    if (response.status === 401 && options.auth) {
      logging.log("HTTP", `401 on ${redactUrl(url)}, refreshing token`);
      return send(url, requestOptions, true);
    }
    return response;
  };
}
