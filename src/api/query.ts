import { AppState, AppStateStatus, Platform } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { Authed, useAuth } from "../auth";
import { isRetryableError } from "./errors";

/**
 * React Native has no window focus events, so drive React Query's focus manager
 * from AppState instead. Without this, `refetchOnWindowFocus` never fires and
 * screens keep showing data from before the app was backgrounded.
 */
export function subscribeToAppState() {
  const subscription = AppState.addEventListener(
    "change",
    (status: AppStateStatus) => {
      if (Platform.OS === "web") return;
      focusManager.setFocused(status === "active");
    },
  );
  return () => subscription.remove();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // Only transport-level failures are worth retrying; a 401/403/4xx will
      // fail identically every time and just delays the error reaching the UI.
      retry: (failureCount, error) =>
        failureCount < 3 && isRetryableError(error),
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutations are not retried by default: a timed-out request may well have
      // been applied server-side, and re-sending it would double the action.
      retry: false,
    },
  },
});

/**
 * Every key that can hold personal data is scoped to the account it was fetched
 * for, so a cache entry can never be rendered for a different user.
 */
export const keys = {
  slots: (scope: string) => ["register", "slots", scope] as const,
  corveeStatus: (scope: string) => ["corvee", "status", scope] as const,
  announcements: (scope: string) => ["feed", "announcements", scope] as const,
  rss: () => ["feed", "rss"] as const,
  events: () => ["calendar", "events"] as const,
  inventory: (query: string) => ["search", "inventory", query] as const,
  articles: (query: string) => ["search", "articles", query] as const,
  albums: (scope: string) => ["media", "albums", scope] as const,
  album: (scope: string, album: string) =>
    ["media", "album", scope, album] as const,
  mediaUser: (scope: string) => ["media", "user", scope] as const,
};

/** Identifies whose data a cache entry belongs to. */
export function useScope(): string {
  const auth = useAuth();
  if (auth.authenticated === Authed.AUTHENTICATED) return auth.user.sub;
  if (auth.authenticated === Authed.GUEST) return "guest";
  return "anonymous";
}
