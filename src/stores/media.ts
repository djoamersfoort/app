import { atom } from "jotai";
import { Api } from "../__generated__/media";
import { Authed, AuthState } from "../auth";

export const apiAtom = atom<Api<unknown> | null>(null);
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
