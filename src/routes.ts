/**
 * Helpers for route params.
 *
 * Expo Router carries params as strings, so the few screens that need a whole
 * object encode it as JSON. Anything large (an album's items, an announcement's
 * HTML) is deliberately *not* passed this way — those routes take an id and read
 * the payload back out of the React Query cache instead.
 */

export function encodeParam(value: unknown): string {
  return JSON.stringify(value);
}

export function decodeParam<T>(value: string | string[] | undefined): T | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // A hand-typed or truncated deep link should render an error state, not crash.
    return null;
  }
}

/** Params arrive as `string | string[]`; take the single value we expect. */
export function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function numberParam(
  value: string | string[] | undefined,
  fallback = 0,
): number {
  const parsed = parseInt(param(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
