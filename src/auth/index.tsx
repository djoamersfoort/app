import {
  createContext,
  JSX,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { Pressable } from "@/components/ui/pressable";
import Icon from "@/components/icon";
import { LEDEN_ADMIN } from "../env";
import logging from "../logging";
import { TokenProvider } from "../api/client";
import AuthScreen, { redirectUri } from "./screen";
import {
  Authed,
  AuthState,
  createAuthState,
  guestState,
  loadStoredSession,
} from "./tokens";

export { Authed } from "./tokens";
export type { AuthState, User } from "./tokens";

logging.log("AUTH", redirectUri);
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext<AuthState>({ authenticated: Authed.LOADING });

export function AuthProvider({ children }: { children: JSX.Element }) {
  const discovery = AuthSession.useAutoDiscovery(`${LEDEN_ADMIN}/o`);
  const [state, setState] = useState<AuthState>({
    authenticated: Authed.LOADING,
  });
  const [guestWarning, setGuestWarning] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    if (!discovery || restored.current) return;
    restored.current = true;

    async function restore() {
      const stored = await loadStoredSession(discovery!);

      if (stored.kind === "guest") {
        setGuestWarning(true);
        return setState(guestState(setState));
      }
      if (stored.kind === "none")
        return setState({ authenticated: Authed.UNAUTHENTICATED });

      const session = createAuthState(setState, discovery!, stored.session);
      setState(session);

      // Surface a dead session now instead of when the user taps something.
      // A network failure here is not fatal; requests will refresh on demand.
      try {
        await session.getToken();
      } catch (error) {
        logging.log("AUTH", `Could not refresh token on startup: ${error}`);
      }
    }

    restore().then();
  }, [discovery]);

  const ready = !!discovery;

  return (
    <AuthContext.Provider value={state}>
      {ready && state.authenticated === Authed.UNAUTHENTICATED && (
        <AuthScreen discovery={discovery} setAuthenticated={setState} />
      )}

      {ready && state.authenticated > Authed.UNAUTHENTICATED && children}

      {(!ready || state.authenticated === Authed.LOADING) && (
        <Center className="flex-1 bg-primary">
          <Spinner className="text-primary-foreground" />
        </Center>
      )}

      {/* Demo mode is easy to forget you are in; keep a persistent reminder. */}
      {guestWarning && state.authenticated === Authed.GUEST && (
        <Box className="absolute inset-x-0 bottom-0">
          <SafeAreaView edges={["bottom"]}>
            <HStack className="m-4 items-center gap-3 rounded-2xl bg-destructive p-4">
              <Icon
                name="alert-circle-outline"
                size={20}
                className="text-white"
              />
              <Text size="sm" className="flex-1 text-white">
                Demo mode staat aan, acties worden niet bewaard!
              </Text>
              <Pressable
                onPress={() => setGuestWarning(false)}
                accessibilityLabel="Sluiten"
                className="active:opacity-70"
              >
                <Text size="sm" className="font-semibold text-white">
                  OK
                </Text>
              </Pressable>
            </HStack>
          </SafeAreaView>
        </Box>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** The token provider for authenticated requests, or null when there is no session. */
export function useTokenProvider(): TokenProvider | null {
  const auth = useAuth();
  return auth.authenticated === Authed.AUTHENTICATED ? auth.getToken : null;
}
