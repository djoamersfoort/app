import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import { DiscoveryDocument } from "expo-auth-session";
import { CLIENT_ID, SCOPES } from "../env";
import logging from "../logging";
import { requestJson, TokenProvider } from "../api/client";
import { HttpError } from "../api/errors";

/** Refresh this long before expiry, so in-flight requests never race the clock. */
const EXPIRY_SKEW_MS = 60_000;
const TOKEN_TIMEOUT_MS = 15_000;

/**
 * Tokens stay on this device and are only readable while it is unlocked, so a
 * backup or a synced keychain never carries a usable session off the phone.
 */
const SECURE: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const KEY = {
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

export interface AuthenticatedState {
  authenticated: Authed.AUTHENTICATED;
  user: User;
  /** Stable across renders; pass straight to the API client. */
  getToken: TokenProvider;
  logout: () => Promise<void>;
}
export interface GuestState {
  authenticated: Authed.GUEST;
  login: () => Promise<void>;
}
export type AuthState =
  | AuthenticatedState
  | GuestState
  | { authenticated: Authed.LOADING }
  | { authenticated: Authed.UNAUTHENTICATED };

export type SetAuthState = (state: AuthState) => void;

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
export function parseIdToken(token: string | undefined, issuer?: string): User {
  if (!token) throw new Error("No id_token in token response");

  let claims: User;
  try {
    claims = jwtDecode<User>(token);
  } catch {
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
export function issuerOf(discovery: DiscoveryDocument) {
  return discovery.discoveryDocument?.issuer;
}

function expiryOf(response: TokenResponse, claims: User) {
  return typeof response.expires_in === "number" && response.expires_in > 0
    ? Date.now() + response.expires_in * 1000
    : claims.exp * 1000;
}

async function requestTokens(
  discovery: DiscoveryDocument,
  body: Record<string, string>,
) {
  if (!discovery.tokenEndpoint)
    throw new Error("The login server is incompletely configured");

  return requestJson<TokenResponse>(discovery.tokenEndpoint, {
    method: "POST",
    timeout: TOKEN_TIMEOUT_MS,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }).toString(),
  });
}

export interface Session {
  token: string;
  refresh: string;
  expiry: number;
  user: User;
}

async function store(session: Omit<Session, "user">) {
  await SecureStore.setItemAsync(KEY.token, session.token, SECURE);
  await SecureStore.setItemAsync(KEY.refresh, session.refresh, SECURE);
  await SecureStore.setItemAsync(KEY.expiry, `${session.expiry}`, SECURE);
}

export async function clearSession() {
  await Promise.all(
    [KEY.token, KEY.refresh, KEY.expiry, KEY.scopes].map((key) =>
      SecureStore.deleteItemAsync(key, SECURE),
    ),
  );
}

export async function setGuest(guest: boolean) {
  if (guest) await SecureStore.setItemAsync(KEY.guest, "true", SECURE);
  else await SecureStore.deleteItemAsync(KEY.guest, SECURE);
}

/** Exchanges an authorization code for a session and persists it. */
export async function exchangeCode(
  discovery: DiscoveryDocument,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<Session> {
  const payload = await requestTokens(discovery, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const user = parseIdToken(payload.id_token, issuerOf(discovery));
  if (!payload.refresh_token)
    throw new Error("No refresh_token in token response");

  const session = {
    token: payload.id_token!,
    refresh: payload.refresh_token,
    expiry: expiryOf(payload, user),
  };

  await store(session);
  await SecureStore.setItemAsync(KEY.scopes, JSON.stringify(SCOPES), SECURE);

  return { ...session, user };
}

export type StoredSession =
  | { kind: "guest" }
  | { kind: "none" }
  | { kind: "session"; session: Session };

/**
 * Reads back whatever the last run left behind, rejecting anything this build
 * can no longer use: a token missing a scope the app now needs, or one whose
 * claims no longer check out.
 */
export async function loadStoredSession(
  discovery: DiscoveryDocument,
): Promise<StoredSession> {
  if (await SecureStore.getItemAsync(KEY.guest, SECURE))
    return { kind: "guest" };

  const [token, refresh, expiry, storedScopes] = await Promise.all([
    SecureStore.getItemAsync(KEY.token, SECURE),
    SecureStore.getItemAsync(KEY.refresh, SECURE),
    SecureStore.getItemAsync(KEY.expiry, SECURE),
    SecureStore.getItemAsync(KEY.scopes, SECURE),
  ]);

  // A build that needs new scopes must re-consent rather than run with a token
  // that silently lacks permissions.
  let scopes: string[] = [];
  try {
    scopes = JSON.parse(storedScopes || "[]");
  } catch {
    scopes = [];
  }

  if (!token || !refresh || !expiry) return { kind: "none" };
  if (SCOPES.some((scope) => !scopes.includes(scope))) {
    await clearSession();
    return { kind: "none" };
  }

  try {
    return {
      kind: "session",
      session: {
        token,
        refresh,
        expiry: parseInt(expiry, 10) || 0,
        user: parseIdToken(token, issuerOf(discovery)),
      },
    };
  } catch (error) {
    logging.log("AUTH", `Stored token rejected: ${error}`);
    await clearSession();
    return { kind: "none" };
  }
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
    private readonly discovery: DiscoveryDocument,
    private session: Session,
    private readonly onRefreshed: (user: User) => void,
    private readonly onInvalid: () => void,
  ) {}

  /** Stable identity, so React Query dependencies do not churn. */
  readonly getToken: TokenProvider = (force = false) => {
    if (this.invalidated) return Promise.reject(new SessionExpiredError());

    const valid = this.session.expiry - EXPIRY_SKEW_MS > Date.now();
    if (!force && valid) return Promise.resolve(this.session.token);
    if (this.refreshing) return this.refreshing;

    this.refreshing = this.refresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  };

  private async refresh(): Promise<string> {
    logging.log("AUTH", "Refreshing tokens...");

    let payload: TokenResponse;
    try {
      payload = await requestTokens(this.discovery, {
        grant_type: "refresh_token",
        refresh_token: this.session.refresh,
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

    const user = parseIdToken(payload.id_token, issuerOf(this.discovery));
    this.session = {
      user,
      token: payload.id_token!,
      expiry: expiryOf(payload, user),
      // Providers may rotate the refresh token; keep the newest one.
      refresh: payload.refresh_token ?? this.session.refresh,
    };

    await store(this.session);
    this.onRefreshed(user);

    logging.log("AUTH", "Finished refreshing tokens");
    return this.session.token;
  }

  async invalidate() {
    if (this.invalidated) return;
    this.invalidated = true;
    await clearSession();
    this.onInvalid();
  }
}

export function createAuthState(
  setState: SetAuthState,
  discovery: DiscoveryDocument,
  session: Session,
): AuthenticatedState {
  const manager = new TokenManager(
    discovery,
    session,
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

export function guestState(setState: SetAuthState): GuestState {
  return {
    authenticated: Authed.GUEST,
    login: async () => {
      await setGuest(false);
      setState({ authenticated: Authed.UNAUTHENTICATED });
    },
  };
}
