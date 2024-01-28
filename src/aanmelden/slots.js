import { atom } from "jotai";
import { AANMELDEN_API_BASE } from "../env";

export const slotsAtom = atom([]);
export async function getSlots(user) {
  const res = await fetch(`${AANMELDEN_API_BASE}/v1/slots`, {
    headers: {
      authorization: `Bearer ${user.tokens.id_token}`,
    },
  });
  const { slots } = await res.json();

  return slots;
}
