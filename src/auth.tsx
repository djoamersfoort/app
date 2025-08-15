import { createContext, useState, JSX, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  useTheme,
  Text,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import { DiscoveryDocument } from "expo-auth-session";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { CLIENT_ID, LEDEN_ADMIN, SCOPES } from "./env";
import logging from "./logging";

const redirectUri = AuthSession.makeRedirectUri({ path: "redirect" });
logging.log("AUTH", redirectUri);
WebBrowser.maybeCompleteAuthSession();

export enum Authed {
  LOADING,
  UNAUTHENTICATED,
  GUEST,
  AUTHENTICATED,
}

interface StripCard {
  used: number;
  count: number;
}

interface User {
  aud: string;
  iat: number;
  at_hash: string;
  sub: string;
  given_name: string;
  family_name: string;
  email: string;
  aanmelden: boolean;
  media: boolean;
  account_type: string;
  days: number;
  iss: string;
  exp: number;
  auth_time: number;
  jti: string;
  stripcard: StripCard | null;
}

interface LoadingState {
  authenticated: Authed.LOADING;
}
interface AuthenticatedState {
  authenticated: Authed.AUTHENTICATED;
  user: User;
  token: Promise<string>;
  logout: () => Promise<void>;
}
interface UnAuthenticatedState {
  authenticated: Authed.UNAUTHENTICATED;
}
interface GuestState {
  authenticated: Authed.GUEST;
  login: () => void;
}
export type AuthState =
  | AuthenticatedState
  | UnAuthenticatedState
  | LoadingState
  | GuestState;

const AuthContext = createContext<AuthState>({
  authenticated: Authed.LOADING,
});

interface TokenResponse {
  id_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function registerForPushNotifications(user: AuthenticatedState) {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return;
  }

  const config = Constants.expoConfig;
  if (!config) return;

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
    projectId: config.extra?.eas.projectId,
  });
  await fetch(`${LEDEN_ADMIN}/notifications/token`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${await user.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: pushToken,
    }),
  });
}

function createAuthState(
  setState: (state: AuthState) => void,
  discovery: DiscoveryDocument,
  token: string,
  refresh: string,
  expiry: number,
): AuthState {
  const state: AuthenticatedState = {
    authenticated: Authed.AUTHENTICATED,
    user: jwtDecode(token),
    async logout() {
      await SecureStore.deleteItemAsync("id_token");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("expiration_date");
      setState({ authenticated: Authed.UNAUTHENTICATED });
    },
    get token() {
      return new Promise<string>(async (resolve) => {
        if (expiry > Date.now()) return resolve(token);

        logging.log("AUTH", "Refreshing tokens");
        const tokens: TokenResponse = await fetch(discovery?.tokenEndpoint!, {
          method: "post",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            refresh_token: refresh,
          }).toString(),
        }).then((res) => res.json());

        token = tokens.id_token;
        expiry = Date.now() + tokens.expires_in * 1000;

        await SecureStore.setItemAsync("id_token", token);
        await SecureStore.setItemAsync("expiration_date", expiry.toString());
        if (tokens.refresh_token) {
          refresh = tokens.refresh_token;
          await SecureStore.setItemAsync("refresh_token", refresh);
        }

        logging.log("AUTH", "Finished refreshing tokens");
        resolve(token);
      });
    },
  };

  registerForPushNotifications(state).then();
  return state;
}

function AuthScreen({
  discovery,
  setAuthenticated,
}: {
  setAuthenticated: (state: AuthState) => void;
  discovery: DiscoveryDocument;
}) {
  const theme = useTheme();

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      redirectUri,
      clientId: CLIENT_ID,
      responseType: "code",
      scopes: SCOPES,
    },
    discovery,
  );

  useEffect(() => {
    async function authenticateUser() {
      if (!result) return;
      if (result.type === "error") {
        Alert.alert(
          "Authentication error",
          result.params.error_description || "something went wrong",
        );
        return;
      }
      if (result.type !== "success") return;

      setAuthenticated({ authenticated: Authed.LOADING });
      const tokens: TokenResponse = await fetch(discovery?.tokenEndpoint!, {
        method: "post",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: CLIENT_ID,
          code: result.params.code,
          redirect_uri: redirectUri,
          code_verifier: request?.codeVerifier,
        } as Record<string, string>).toString(),
      }).then((res) => res.json());

      const token = tokens.id_token;
      const expiry = Date.now() + tokens.expires_in * 1000;
      const refresh = tokens.refresh_token;

      await SecureStore.setItemAsync("id_token", token);
      await SecureStore.setItemAsync("expiration_date", expiry.toString());
      await SecureStore.setItemAsync("refresh_token", refresh!);
      await SecureStore.setItemAsync("scopes", JSON.stringify(SCOPES));

      setAuthenticated(
        createAuthState(setAuthenticated, discovery, token, refresh!, expiry),
      );
    }

    authenticateUser().then();
  }, [result]);

  async function guest() {
    await SecureStore.setItemAsync("guest", "true");
    setAuthenticated({
      authenticated: Authed.GUEST,
      login: async () => {
        await SecureStore.deleteItemAsync("guest");
        setAuthenticated({
          authenticated: Authed.UNAUTHENTICATED,
        });
      },
    });
  }

  return (
    <SafeAreaView
      style={{
        ...styles.container,
        backgroundColor: theme.colors.primaryContainer,
      }}
    >
      <Button
        style={styles.button}
        labelStyle={{ fontSize: 17 }}
        contentStyle={{ height: 50 }}
        mode={"contained"}
        onPress={() => promptAsync()}
      >
        Log in
      </Button>
      <Text onPress={guest} style={styles.guest}>
        Gebruik demo mode
      </Text>
    </SafeAreaView>
  );
}

export function AuthProvider({ children }: { children: JSX.Element }) {
  const theme = useTheme();
  const discovery = AuthSession.useAutoDiscovery(`${LEDEN_ADMIN}/o`);
  const [authenticated, setAuthenticated] = useState<AuthState>({
    authenticated: Authed.LOADING,
  });
  const [guestWarning, setGuestWarning] = useState(false);

  useEffect(() => {
    if (!discovery) return;
    async function getAuthenticated() {
      if (await SecureStore.getItemAsync("guest")) {
        setGuestWarning(true);
        return setAuthenticated({
          authenticated: Authed.GUEST,
          login: async () => {
            await SecureStore.deleteItemAsync("guest");
            setAuthenticated({
              authenticated: Authed.UNAUTHENTICATED,
            });
          },
        });
      }

      const token = await SecureStore.getItemAsync("id_token");
      const refresh = await SecureStore.getItemAsync("refresh_token");
      const expiry = await SecureStore.getItemAsync("expiration_date");

      const scopes = JSON.parse(
        (await SecureStore.getItemAsync("scopes")) || "[]",
      ) as string[];
      const missing = SCOPES.find((scope) => !scopes.includes(scope));

      if (!token || !refresh || !expiry || missing) {
        return setAuthenticated({
          authenticated: Authed.UNAUTHENTICATED,
        });
      }

      setAuthenticated(
        createAuthState(
          setAuthenticated,
          discovery!,
          token,
          refresh,
          parseInt(expiry),
        ),
      );
    }

    getAuthenticated().then();
  }, [discovery]);

  return (
    <AuthContext.Provider value={authenticated}>
      {discovery && authenticated.authenticated === Authed.UNAUTHENTICATED && (
        <AuthScreen discovery={discovery} setAuthenticated={setAuthenticated} />
      )}
      {discovery &&
        authenticated.authenticated > Authed.UNAUTHENTICATED &&
        children}
      {!discovery ||
        (authenticated.authenticated === Authed.LOADING && (
          <View
            style={{
              ...styles.center,
              backgroundColor: theme.colors.primaryContainer,
            }}
          >
            <ActivityIndicator animating={true} />
          </View>
        ))}

      <Snackbar
        visible={guestWarning}
        onDismiss={() => setGuestWarning(false)}
        action={{
          label: "OK",
          onPress: () => setGuestWarning(false),
        }}
        theme={{
          colors: {
            inverseSurface: theme.colors.errorContainer,
            inverseOnSurface: theme.colors.onErrorContainer,
          },
        }}
      >
        Demo mode staat aan, acties worden niet bewaard!
      </Snackbar>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  button: {
    margin: 15,
    marginBottom: 0,
    borderRadius: 25,
  },
  guest: {
    width: "100%",
    textAlign: "center",
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 20,
  },
});

export default AuthContext;
