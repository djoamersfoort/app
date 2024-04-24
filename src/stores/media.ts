import { atom } from "jotai";
import { Api } from "../__generated__/media";

export const apiAtom = atom<Api<unknown> | null>(null);
export function getApi(token: string) {
  return new Api({
    baseUrl: "https://media.djoamersfoort.nl/api",
    baseApiParams: {
      credentials: "same-origin",
      headers: {
        authorization: `Bearer ${token}`,
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
    },
  });
}
