import { Api } from "../__generated__/media";
import AuthContext, { Authed, AuthState } from "../auth";
import { useContext, useMemo } from "react";

export function getApi(authState: AuthState) {
  return new Api({
    baseUrl: "https://media.djoamersfoort.nl/api",
    baseApiParams: {
      credentials: "same-origin",
      redirect: "follow",
      referrerPolicy: "no-referrer",
    },
    async customFetch(...fetchParams: Parameters<typeof fetch>) {
      if (authState.authenticated !== Authed.AUTHENTICATED)
        throw new Error("Unauthenticated");
      if (!fetchParams[1]) fetchParams[1] = {};
      if (!fetchParams[1].headers) fetchParams[1].headers = {};

      Object.assign(fetchParams[1].headers, {
        authorization: `Bearer ${await authState.token}`,
      });

      return fetch(...fetchParams);
    },
  });
}
export function useApi() {
  const authState = useContext(AuthContext);
  return useMemo(() => {
    if (authState.authenticated !== Authed.AUTHENTICATED) {
      return null;
    }

    return getApi(authState);
  }, [authState]);
}
