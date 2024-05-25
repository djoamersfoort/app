import { atom } from "jotai";
import { nextFriday, nextSaturday } from "date-fns";

export interface Presence {
  id: number;
  seen: boolean;
  name: string;
}

export interface Member {
  id: number;
  name: string;
}

export interface Slot {
  name: string;
  pod: string;
  description: string;
  announcement: string;
  tutors: string[];
  date: string;
  presence?: Presence[];

  available: number;
  taken: number;
  is_registered: boolean;
}

export const demoSlots = [
  {
    name: "Vrijdag",
    pod: "fri",
    description: "Vrijdag (19:00 - 22:00)",
    announcement: "",
    tutors: ["Henk", "Pieter", "Frans"],
    date: nextFriday(new Date()).toDateString(),

    available: 8,
    taken: 4,
    is_registered: false,
  },
  {
    name: "Zaterdag",
    pod: "sat",
    description: "Zaterdag (9:30 - 13:30)",
    announcement: "Vandaag is de open dag, dus we sluiten op tijd",
    tutors: ["Henk", "Anita"],
    date: nextSaturday(new Date()).toDateString(),

    available: 2,
    taken: 10,
    is_registered: true,
  },
];

export const slotsAtom = atom<Slot[] | null>([]);
export const membersAtom = atom<Member[]>([]);
export async function getSlots(token: string | null) {
  if (!token) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 500 + 250),
    );

    return { slots: demoSlots };
  }

  const { slots, members }: { slots: Slot[]; members?: Member[] } = await fetch(
    "https://aanmelden.djoamersfoort.nl/api/v1/slots",
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  ).then((res) => res.json());

  return { slots, members };
}
