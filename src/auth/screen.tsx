import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import { DiscoveryDocument } from "expo-auth-session";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
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
    <Box className="flex-1 bg-primary">
      <SafeAreaView style={{ flex: 1 }}>
        <VStack className="flex-1 justify-between p-6">
          <VStack className="flex-1 items-center justify-center gap-4">
            {/* The app's own icon, rather than a stock glyph. */}
            <Box className="h-24 w-24 overflow-hidden rounded-3xl bg-primary-foreground">
              <Image
                source={require("../../assets/icon.png")}
                alt="DJO Amersfoort"
                className="h-full w-full"
                resizeMode="contain"
              />
            </Box>
            <VStack className="gap-1">
              <Heading
                size="3xl"
                className="text-center text-primary-foreground"
              >
                DJO Amersfoort
              </Heading>
              <Text className="text-center text-primary-foreground/70">
                Meld je aan, bekijk de agenda en blijf op de hoogte.
              </Text>
            </VStack>
          </VStack>

          <VStack className="gap-2">
            <Button
              size="lg"
              variant="secondary"
              isDisabled={!request || busy}
              onPress={() => promptAsync()}
              className="rounded-2xl"
            >
              {busy && <ButtonSpinner />}
              <ButtonText>Log in</ButtonText>
            </Button>

            <Pressable onPress={guest} className="py-3 active:opacity-70">
              <Text className="text-center text-primary-foreground/80">
                Gebruik demo mode
              </Text>
            </Pressable>
          </VStack>
        </VStack>
      </SafeAreaView>
    </Box>
  );
}
