import { Authed, useAuth } from "../auth";

/**
 * Every key that can contain personal data is scoped to the account it was
 * fetched for, so a cache entry can never be rendered for a different user.
 */
export type Scope = string;

export const keys = {
  slots: (scope: Scope) => ["register", "slots", scope] as const,
  corveeStatus: (scope: Scope) => ["corvee", "status", scope] as const,
  announcements: (scope: Scope) => ["feed", "announcements", scope] as const,
  rss: () => ["feed", "rss"] as const,
  events: () => ["calendar", "events"] as const,
  inventory: (query: string) => ["search", "inventory", query] as const,
  articles: (query: string) => ["search", "articles", query] as const,
  albums: (scope: Scope) => ["media", "albums", scope] as const,
  album: (scope: Scope, album: string) =>
    ["media", "album", scope, album] as const,
  mediaUser: (scope: Scope) => ["media", "user", scope] as const,
};

/** Identifies whose data a cache entry belongs to. */
export function useScope(): Scope {
  const auth = useAuth();
  if (auth.authenticated === Authed.AUTHENTICATED) return auth.user.sub;
  if (auth.authenticated === Authed.GUEST) return "guest";
  return "anonymous";
}
