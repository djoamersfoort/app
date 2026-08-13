import { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, useTheme } from "react-native-paper";
import * as AuthSession from "expo-auth-session";
import { DiscoveryDocument } from "expo-auth-session";
import { CLIENT_ID, SCOPES } from "../env";
import logging from "../logging";
import {
  Authed,
  clearSession,
  createAuthState,
  exchangeCode,
  guestState,
  SetAuthState,
  setGuest,
} from "./tokens";

export const redirectUri = AuthSession.makeRedirectUri({ path: "redirect" });

function fail(message: string) {
  Alert.alert("Authentication error", message);
}

export default function AuthScreen({
  discovery,
  setAuthenticated,
}: {
  discovery: DiscoveryDocument;
  setAuthenticated: SetAuthState;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      redirectUri,
      clientId: CLIENT_ID,
      responseType: "code",
      scopes: SCOPES,
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    async function authenticate() {
      if (!result) return;
      if (result.type === "error")
        return fail(result.params.error_description || "something went wrong");
      if (result.type !== "success") return;

      // Without the verifier the code is interceptable; refuse rather than
      // silently downgrade to a plain authorization code exchange.
      if (!request?.codeVerifier)
        return fail("The secure login session expired, please try again");

      setBusy(true);
      setAuthenticated({ authenticated: Authed.LOADING });
      try {
        const session = await exchangeCode(
          discovery,
          result.params.code,
          request.codeVerifier,
          redirectUri,
        );
        setAuthenticated(createAuthState(setAuthenticated, discovery, session));
      } catch (error) {
        // Never strand the app on the loading spinner: fall back to the login
        // screen so the user can try again.
        logging.log("AUTH", `Login failed: ${error}`);
        await clearSession();
        setAuthenticated({ authenticated: Authed.UNAUTHENTICATED });
        fail(error instanceof Error ? error.message : "something went wrong");
      } finally {
        setBusy(false);
      }
    }

    authenticate().then();
  }, [result]);

  async function guest() {
    await setGuest(true);
    setAuthenticated(guestState(setAuthenticated));
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <Button
        style={styles.button}
        labelStyle={{ fontSize: 17 }}
        contentStyle={{ height: 50 }}
        mode={"contained"}
        disabled={!request || busy}
        loading={busy}
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
});
