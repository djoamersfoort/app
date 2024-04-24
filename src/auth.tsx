import { createContext, ReactNode, useState, JSX, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import { Alert, Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { Button, useTheme, Text } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import { DiscoveryDocument, TokenError } from "expo-auth-session";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const redirectUri = AuthSession.makeRedirectUri({ path: "redirect" });
WebBrowser.maybeCompleteAuthSession();

export enum Authed {
  LOADING,
  UNAUTHENTICATED,
  GUEST,
  AUTHENTICATED,
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
type AuthState =
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
  await fetch("https://leden.djoamersfoort.nl/notifications/token", {
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

        const tokens: TokenResponse = await fetch(discovery?.tokenEndpoint!, {
          method: "post",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: "QI0CNwnSLMJQbsZindMceAhtPR7lQlis0lTcCxGZ",
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
      clientId: "QI0CNwnSLMJQbsZindMceAhtPR7lQlis0lTcCxGZ",
      responseType: "code",
      scopes: [
        "openid",
        "user/basic",
        "user/names",
        "user/email",
        "media",
        "aanmelden",
      ],
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
          client_id: "QI0CNwnSLMJQbsZindMceAhtPR7lQlis0lTcCxGZ",
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
        Of ga door als gast
      </Text>
    </SafeAreaView>
  );
}

export function AuthProvider({ children }: { children: JSX.Element }) {
  const theme = useTheme();
  const discovery = AuthSession.useAutoDiscovery(
    "https://leden.djoamersfoort.nl/o",
  );
  const [authenticated, setAuthenticated] = useState<AuthState>({
    authenticated: Authed.LOADING,
  });

  useEffect(() => {
    if (!discovery) return;
    async function getAuthenticated() {
      if (await SecureStore.getItemAsync("guest")) {
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

      if (!token || !refresh || !expiry) {
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
            <Text>Loading...</Text>
          </View>
        ))}
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
