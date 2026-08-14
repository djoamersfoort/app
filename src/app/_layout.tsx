import { useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";
import { decode, encode } from "base-64";
import * as Notifications from "expo-notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth";
import SessionProvider from "@/components/session";
import ReloadProvider from "@/components/register/reload-provider";
import CustomNavigationBar from "@/components/navbar";
import { queryClient, subscribeToAppState } from "@/api/query";
import { theme } from "@/theme";
import "@/logging";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

// Hermes ships without base64 helpers; jwt-decode and friends expect them.
const globals = globalThis as {
  btoa?: typeof encode;
  atob?: typeof decode;
};
if (!globals.btoa) globals.btoa = encode;
if (!globals.atob) globals.atob = decode;

/**
 * Navigation only needs six colours, so they are mirrored from the same tokens
 * the Tailwind theme uses rather than adapted out of a Material palette.
 */
const navigationThemes = {
  light: {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: theme.light.primary,
      background: theme.light.background,
      card: theme.light.card,
      text: theme.light.foreground,
      border: theme.light.border,
    },
  },
  dark: {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      primary: theme.dark.primary,
      background: theme.dark.background,
      card: theme.dark.card,
      text: theme.dark.foreground,
      border: theme.dark.border,
    },
  },
};

export default function RootLayout() {
  const dark = useColorScheme() === "dark";

  // React Query has no window to listen to on native; feed it AppState instead.
  useEffect(subscribeToAppState, []);

  return (
    <GluestackUIProvider mode={dark ? "dark" : "light"}>
      <QueryClientProvider client={queryClient}>
        {/* Replaces the theme prop that used to sit on NavigationContainer. */}
        <ThemeProvider
          value={dark ? navigationThemes.dark : navigationThemes.light}
        >
          <AuthProvider>
            <SessionProvider>
              <ReloadProvider>
                <Stack screenOptions={{ header: CustomNavigationBar }}>
                  <Stack.Screen
                    name={"(tabs)"}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name={"search"}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name={"redirect"}
                    options={{ headerShown: false }}
                  />
                </Stack>
              </ReloadProvider>
            </SessionProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
