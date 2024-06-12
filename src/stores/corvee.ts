import { CORVEE } from "../env";
import { atom } from "jotai";

export interface CorveeProfile {
  id: string;
  first_name: string;
  last_name: string;
  picture: string;
}

export interface CorveeState {
  current: CorveeProfile[];
  day: string;
  pod: string;
}

export const stateAtom = atom<CorveeState | null | undefined>(null);

export async function getStatus(token: string) {
  const res = await fetch(`${CORVEE}/api/v1/status`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  return (await res.json()) as CorveeState;
}
