import { atom, useSetAtom } from "jotai";
import { nextFriday, nextSaturday } from "date-fns";
import { AANMELDEN } from "../env";
import logging from "../logging";
import { io } from "socket.io-client";
import { useContext } from "react";
import AuthContext, { Authed } from "../auth";

export interface Presence {
  id: number;
  seen: boolean;
  name: string;
  stripcard_used: number | null;
  stripcard_count: number | null;
}

export interface Member {
  id: number;
  name: string;
  stripcard_used: number | null;
  stripcard_count: number | null;
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
    logging.log("REGISTER", "No valid token, reverting to demo");
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 500 + 250),
    );

    return { slots: demoSlots };
  }

  logging.log("REGISTER", "Valid token, fetching slots");
  const { slots, members }: { slots: Slot[]; members?: Member[] } = await fetch(
    `${AANMELDEN}/api/v1/slots`,
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  ).then((res) => res.json());

  return { slots, members };
}
