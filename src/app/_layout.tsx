import { ComponentProps, useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";
import merge from "deepmerge";
import { decode, encode } from "base-64";
import * as Notifications from "expo-notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../auth";
import SessionProvider from "../components/session";
import ReloadProvider from "../components/register/reload-provider";
import CustomNavigationBar from "../components/navbar";
import { queryClient, subscribeToAppState } from "../api/query";
import "../logging";

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
 * react-native-paper's `adaptNavigationTheme` is typed against the standalone
 * React Navigation package. Expo Router ships its own build whose themes carry
 * the same six colors but declare them as `ColorValue`, so this describes the
 * shape the adapter actually reads.
 */
type AdaptableTheme = {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
};

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme as AdaptableTheme,
  reactNavigationDark: NavigationDarkTheme as AdaptableTheme,
});

const CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);

/**
 * Expo Router bundles its own React Navigation build whose Theme types colors
 * as ColorValue rather than string. The merged Paper theme is structurally
 * compatible, so this only bridges the two declarations.
 */
function navigationTheme(theme: typeof CombinedDefaultTheme) {
  return theme as unknown as ComponentProps<typeof ThemeProvider>["value"];
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme;

  // React Query has no window to listen to on native; feed it AppState instead.
  useEffect(subscribeToAppState, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Replaces the theme prop that used to sit on NavigationContainer. */}
      <ThemeProvider value={navigationTheme(theme)}>
        <PaperProvider theme={theme}>
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
        </PaperProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
