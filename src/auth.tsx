import {
  createContext,
  useState,
  JSX,
  useEffect,
  useContext,
  useRef,
} from "react";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  useTheme,
  Text,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import { DiscoveryDocument } from "expo-auth-session";
import { CLIENT_ID, LEDEN_ADMIN, SCOPES } from "./env";
import logging from "./logging";
import { requestJson, TokenProvider } from "./api/client";
import { HttpError } from "./api/errors";

const redirectUri = AuthSession.makeRedirectUri({ path: "redirect" });
logging.log("AUTH", redirectUri);
WebBrowser.maybeCompleteAuthSession();

/** Refresh this long before the token actually expires, so in-flight requests never race the clock. */
const EXPIRY_SKEW_MS = 60_000;
const REFRESH_TIMEOUT_MS = 15_000;

/**
 * Tokens stay on this device and are only readable while it is unlocked, so a
 * backup or a synced keychain never carries a usable session off the phone.
 */
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const STORAGE = {
  token: "id_token",
  refresh: "refresh_token",
  expiry: "expiration_date",
  scopes: "scopes",
  guest: "guest",
} as const;

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

export interface User {
  aud: string | string[];
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
  /** Stable across renders; pass straight to the API client. */
  getToken: TokenProvider;
  logout: () => Promise<void>;
}
interface UnAuthenticatedState {
  authenticated: Authed.UNAUTHENTICATED;
}
interface GuestState {
  authenticated: Authed.GUEST;
  login: () => Promise<void>;
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
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

/** The refresh token is no longer accepted; only a fresh login can recover. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
    Object.setPrototypeOf(this, SessionExpiredError.prototype);
  }
}

/**
 * Validates the claims we depend on before trusting a token.
 *
 * The signature itself is not checked here: the token is only ever accepted
 * straight from the provider's token endpoint over TLS (never from a redirect
 * parameter), so the transport is what authenticates it. These checks catch a
 * misconfigured or swapped provider, and a token minted for another client.
 */
function parseIdToken(token: string | undefined, issuer?: string): User {
  if (!token || typeof token !== "string")
    throw new Error("No id_token in token response");

  let claims: User;
  try {
    claims = jwtDecode<User>(token);
  } catch (error) {
    throw new Error("id_token could not be decoded");
  }

  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(CLIENT_ID))
    throw new Error("id_token was issued for a different client");

  if (issuer && claims.iss !== issuer)
    throw new Error("id_token came from a different issuer");

  if (typeof claims.exp !== "number")
    throw new Error("id_token has no expiry claim");

  return claims;
}

/** The provider's own identifier, from the fetched discovery document. */
function issuerOf(discovery: DiscoveryDocument): string | undefined {
  return discovery.discoveryDocument?.issuer;
}

function expiryOf(response: TokenResponse, claims: User) {
  return typeof response.expires_in === "number" && response.expires_in > 0
    ? Date.now() + response.expires_in * 1000
    : claims.exp * 1000;
}

async function storeSession(token: string, refresh: string, expiry: number) {
  await SecureStore.setItemAsync(STORAGE.token, token, SECURE_OPTIONS);
  await SecureStore.setItemAsync(STORAGE.refresh, refresh, SECURE_OPTIONS);
  await SecureStore.setItemAsync(
    STORAGE.expiry,
    expiry.toString(),
    SECURE_OPTIONS,
  );
}

async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE.token, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(STORAGE.refresh, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(STORAGE.expiry, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(STORAGE.scopes, SECURE_OPTIONS),
  ]);
}

/**
 * Owns exactly one session's tokens. Refreshes are single-flight: concurrent
 * callers share one in-flight request, and the slot is only released once that
 * request has fully settled, so a burst of parallel screens can never mint
 * several refresh tokens and invalidate each other.
 */
class TokenManager {
  private refreshing: Promise<string> | null = null;
  private invalidated = false;

  constructor(
    private readonly tokenEndpoint: string,
    private readonly issuer: string | undefined,
    private token: string,
    private refresh: string,
    private expiry: number,
    private readonly onRefreshed: (claims: User) => void,
    private readonly onInvalid: () => void,
  ) {}

  get valid() {
    return this.expiry - EXPIRY_SKEW_MS > Date.now();
  }

  /** Stable identity, so React Query dependencies do not churn. */
  readonly getToken: TokenProvider = (force = false) => {
    if (this.invalidated) return Promise.reject(new SessionExpiredError());
    if (!force && this.valid) return Promise.resolve(this.token);
    if (this.refreshing) return this.refreshing;

    this.refreshing = this.performRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  };

  private async performRefresh(): Promise<string> {
    logging.log("AUTH", "Refreshing tokens...");

    let payload: TokenResponse;
    try {
      payload = await requestJson<TokenResponse>(this.tokenEndpoint, {
        method: "POST",
        timeout: REFRESH_TIMEOUT_MS,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: CLIENT_ID,
          refresh_token: this.refresh,
        }).toString(),
      });
    } catch (error) {
      // A 4xx means the provider rejected the refresh token itself, so the
      // session is unrecoverable. Anything else (offline, 5xx, timeout) is
      // transient and must not log the user out.
      if (error instanceof HttpError && error.status < 500) {
        logging.log("AUTH", `Session rejected (${error.status}), logging out`);
        await this.invalidate();
        throw new SessionExpiredError();
      }
      logging.log("AUTH", `Refresh failed, keeping session: ${error}`);
      throw error;
    }

    const claims = parseIdToken(payload.id_token, this.issuer);
    this.token = payload.id_token!;
    this.expiry = expiryOf(payload, claims);
    // Providers may rotate the refresh token; keep the newest one.
    if (payload.refresh_token) this.refresh = payload.refresh_token;

    await storeSession(this.token, this.refresh, this.expiry);
    this.onRefreshed(claims);

    logging.log("AUTH", "Finished refreshing tokens");
    return this.token;
  }

  async invalidate() {
    if (this.invalidated) return;
    this.invalidated = true;
    await clearSession();
    this.onInvalid();
  }
}

function guestState(setAuthenticated: (state: AuthState) => void): GuestState {
  return {
    authenticated: Authed.GUEST,
    login: async () => {
      await SecureStore.deleteItemAsync(STORAGE.guest, SECURE_OPTIONS);
      setAuthenticated({ authenticated: Authed.UNAUTHENTICATED });
    },
  };
}

function AuthScreen({
  discovery,
  setAuthenticated,
}: {
  setAuthenticated: (state: AuthState) => void;
  discovery: DiscoveryDocument;
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
    async function authenticateUser() {
      if (!result) return;
      if (result.type === "error") {
        return Alert.alert(
          "Authentication error",
          result.params.error_description || "something went wrong",
        );
      }
      if (result.type !== "success") return;

      if (!discovery.tokenEndpoint) {
        return Alert.alert(
          "Authentication error",
          "The login server is incompletely configured",
        );
      }
      // Without the verifier the code is interceptable; refuse rather than
      // silently downgrade to a plain authorization code exchange.
      if (!request?.codeVerifier) {
        return Alert.alert(
          "Authentication error",
          "The secure login session expired, please try again",
        );
      }

      setBusy(true);
      setAuthenticated({ authenticated: Authed.LOADING });
      try {
        const payload = await requestJson<TokenResponse>(
          discovery.tokenEndpoint,
          {
            method: "POST",
            timeout: REFRESH_TIMEOUT_MS,
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: CLIENT_ID,
              code: result.params.code,
              redirect_uri: redirectUri,
              code_verifier: request.codeVerifier,
            }).toString(),
          },
        );

        const claims = parseIdToken(payload.id_token, issuerOf(discovery));
        if (!payload.refresh_token)
          throw new Error("No refresh_token in token response");

        const expiry = expiryOf(payload, claims);
        await storeSession(payload.id_token!, payload.refresh_token, expiry);
        await SecureStore.setItemAsync(
          STORAGE.scopes,
          JSON.stringify(SCOPES),
          SECURE_OPTIONS,
        );

        setAuthenticated(
          createAuthState(setAuthenticated, discovery, {
            token: payload.id_token!,
            refresh: payload.refresh_token,
            expiry,
            user: claims,
          }),
        );
      } catch (error) {
        // Never strand the app on the loading spinner: fall back to the login
        // screen so the user can try again.
        logging.log("AUTH", `Login failed: ${error}`);
        await clearSession();
        setAuthenticated({ authenticated: Authed.UNAUTHENTICATED });
        Alert.alert(
          "Authentication error",
          error instanceof Error ? error.message : "something went wrong",
        );
      } finally {
        setBusy(false);
      }
    }

    authenticateUser().then();
  }, [result]);

  async function guest() {
    await SecureStore.setItemAsync(STORAGE.guest, "true", SECURE_OPTIONS);
    setAuthenticated(guestState(setAuthenticated));
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

interface Session {
  token: string;
  refresh: string;
  expiry: number;
  user: User;
}

function createAuthState(
  setState: (state: AuthState) => void,
  discovery: DiscoveryDocument,
  session: Session,
): AuthenticatedState {
  const manager = new TokenManager(
    discovery.tokenEndpoint!,
    issuerOf(discovery),
    session.token,
    session.refresh,
    session.expiry,
    // A refresh returns updated claims (strippenkaart, rollen); keep the UI in sync.
    (user) => setState({ ...state, user }),
    () => setState({ authenticated: Authed.UNAUTHENTICATED }),
  );

  const state: AuthenticatedState = {
    authenticated: Authed.AUTHENTICATED,
    user: session.user,
    getToken: manager.getToken,
    logout: async () => {
      logging.log("AUTH", "Logging out.");
      await manager.invalidate();
    },
  };

  return state;
}

export function AuthProvider({ children }: { children: JSX.Element }) {
  const theme = useTheme();
  const discovery = AuthSession.useAutoDiscovery(`${LEDEN_ADMIN}/o`);
  const [authenticated, setAuthenticated] = useState<AuthState>({
    authenticated: Authed.LOADING,
  });
  const [guestWarning, setGuestWarning] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    if (!discovery || restored.current) return;
    restored.current = true;

    async function restore() {
      if (await SecureStore.getItemAsync(STORAGE.guest, SECURE_OPTIONS)) {
        setGuestWarning(true);
        return setAuthenticated(guestState(setAuthenticated));
      }

      const [token, refresh, expiry, storedScopes] = await Promise.all([
        SecureStore.getItemAsync(STORAGE.token, SECURE_OPTIONS),
        SecureStore.getItemAsync(STORAGE.refresh, SECURE_OPTIONS),
        SecureStore.getItemAsync(STORAGE.expiry, SECURE_OPTIONS),
        SecureStore.getItemAsync(STORAGE.scopes, SECURE_OPTIONS),
      ]);

      // A build that needs new scopes must re-consent rather than run with a
      // token that silently lacks permissions.
      let scopes: string[] = [];
      try {
        scopes = JSON.parse(storedScopes || "[]");
      } catch {
        scopes = [];
      }
      const missing = SCOPES.some((scope) => !scopes.includes(scope));

      if (!token || !refresh || !expiry || missing) {
        if (missing && token) await clearSession();
        return setAuthenticated({ authenticated: Authed.UNAUTHENTICATED });
      }

      let user: User;
      try {
        user = parseIdToken(token, issuerOf(discovery!));
      } catch (error) {
        logging.log("AUTH", `Stored token rejected: ${error}`);
        await clearSession();
        return setAuthenticated({ authenticated: Authed.UNAUTHENTICATED });
      }

      const state = createAuthState(setAuthenticated, discovery!, {
        token,
        refresh,
        expiry: parseInt(expiry, 10) || 0,
        user,
      });
      setAuthenticated(state);

      // Surface a dead session now instead of when the user taps something.
      // A network failure here is not fatal; requests will refresh on demand.
      try {
        await state.getToken();
      } catch (error) {
        logging.log("AUTH", `Could not refresh token on startup: ${error}`);
      }
    }

    restore().then();
  }, [discovery]);

  return (
    <AuthContext.Provider value={authenticated}>
      {discovery && authenticated.authenticated === Authed.UNAUTHENTICATED && (
        <AuthScreen discovery={discovery} setAuthenticated={setAuthenticated} />
      )}
      {discovery &&
        authenticated.authenticated > Authed.UNAUTHENTICATED &&
        children}
      {(!discovery || authenticated.authenticated === Authed.LOADING) && (
        <View
          style={{
            ...styles.center,
            backgroundColor: theme.colors.primaryContainer,
          }}
        >
          <ActivityIndicator animating={true} />
        </View>
      )}

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

export function useAuth() {
  return useContext(AuthContext);
}

/** The token provider for authenticated requests, or null when there is no session. */
export function useTokenProvider(): TokenProvider | null {
  const auth = useAuth();
  return auth.authenticated === Authed.AUTHENTICATED ? auth.getToken : null;
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
