import { AppState, AppStateStatus, Platform } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { isRetryableError } from "./errors";

/**
 * React Native has no window focus events, so drive React Query's focus
 * manager from AppState instead. Without this, `refetchOnWindowFocus` never
 * fires and screens keep showing data from before the app was backgrounded.
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
