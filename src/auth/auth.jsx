import * as AuthSession from "expo-auth-session";
import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { Text } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import LoginScreen from "./loginscreen";
import { CLIENT_ID, NOTIFICATIONS_API_BASE, OAUTH_BASE } from "../env";

const redirectUri = AuthSession.makeRedirectUri({ path: 'redirect' });
WebBrowser.maybeCompleteAuthSession();

export const UserContext = React.createContext();
export default function Auth({ children, expoPushToken }) {
  const discovery = AuthSession.useAutoDiscovery(OAUTH_BASE);

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri,
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
  const [state, setState] = useState("loading");
  const [user, setUser] = useState(null);
  function updateTokens(tokens) {
    if (tokens.error) {
      console.error(tokens.error);
      setState("unauthenticated");
      return;
    }

    SecureStore.setItem("access_token", tokens.access_token);
    SecureStore.setItem("refresh_token", tokens.refresh_token);
    SecureStore.setItem("id_token", tokens.id_token);
    SecureStore.setItem(
      "expires",
      (Date.now() + tokens.expires_in * 1000).toString(),
    );

    setUser({
      ...jwtDecode(tokens.id_token),
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
      },
    });
    setState("authenticated");
  }

  useEffect(() => {
    if (result?.type !== "success") return;

    const { code } = result.params;
    fetch(discovery.tokenEndpoint, {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        code,
        redirect_uri: redirectUri,
        code_verifier: request?.codeVerifier,
      }).toString(),
    })
      .then((res) => res.json())
      .then((tokens) => updateTokens(tokens));
  }, [result]);

  useEffect(() => {
    if (!discovery) return;

    SecureStore.getItemAsync("id_token").then((idToken) => {
      if (!idToken) return setState("unauthenticated");

      const expires = SecureStore.getItem("expires");
      if (Number(expires) < Date.now()) {
        const refresh_token = SecureStore.getItem("refresh_token");
        if (!refresh_token) return setState("unauthenticated");

        fetch(discovery.tokenEndpoint, {
          method: "post",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            refresh_token,
          }).toString(),
        })
          .then((res) => res.json())
          .then((tokens) => updateTokens(tokens))
          .catch((err) => {
            console.error(err);
            setState("unauthenticated");
          });
      }

      setUser({
        ...jwtDecode(idToken),
        tokens: {
          access_token: SecureStore.getItem("access_token"),
          refresh_token: SecureStore.getItem("refresh_token"),
          id_token: idToken,
        },
      });
      setState("authenticated");
    });
  }, [discovery]);

  useEffect(() => {
    if (state !== "authenticated") return;
    if (!expoPushToken) return;

    fetch(`${NOTIFICATIONS_API_BASE}/token`, {
      method: "post",
      headers: {
        authorization: `Bearer ${user.tokens.id_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: expoPushToken,
      }),
    })
      .then((res) => res.text())
      .then((res) => console.log(res));
  }, [state, expoPushToken]);

  return (
    <UserContext.Provider value={user}>
      {state === "loading" && <Text>Loading...</Text>}
      {state === "unauthenticated" && (
        <LoginScreen onPress={() => promptAsync()} />
      )}
      {state === "authenticated" && children}
    </UserContext.Provider>
  );
}
