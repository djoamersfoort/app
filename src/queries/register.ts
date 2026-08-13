import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nextFriday, nextSaturday } from "date-fns";
import { AANMELDEN } from "../env";
import {
  requestJson,
  requestText,
  segment,
  TokenProvider,
} from "../api/client";
import { keys, useScope } from "../api/query";
import { showError } from "../api/errors";
import { Authed, useAuth, useTokenProvider } from "../auth";
import logging from "../logging";

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

export interface Registration {
  slots: Slot[];
  members: Member[];
  dates: Date[];
}

export const demoSlots: Slot[] = [
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

interface SlotsResponse {
  slots?: Slot[];
  members?: Member[];
  registered_dates?: string[];
}

function errorFromBody(body: string): string | undefined {
  if (!body) return undefined;

  try {
    const payload = JSON.parse(body);
    if (payload && typeof payload.error === "string" && payload.error)
      return payload.error;
  } catch {
    // Not every action endpoint answers with JSON; an unparseable 2xx body is
    // still a success and must not fail the mutation.
  }

  return undefined;
}

/**
 * Aanmelden answers with HTTP 200 and an `error` field when it refuses an
 * action. Surface that as a real rejection so React Query and the UI treat it
 * as a failure instead of a silent success.
 */
async function action(url: string, auth: TokenProvider, signal?: AbortSignal) {
  const message = errorFromBody(await requestText(url, { auth, signal }));
  if (message) throw new Error(message);
}

export function useRegistration() {
  const auth = useAuth();
  const token = useTokenProvider();
  const scope = useScope();

  return useQuery({
    queryKey: keys.slots(scope),
    enabled: auth.authenticated !== Authed.LOADING,
    queryFn: async ({ signal }): Promise<Registration> => {
      if (!token) {
        logging.log("REGISTER", "No valid token, reverting to demo");
        return { slots: demoSlots, members: [], dates: [] };
      }

      const payload = await requestJson<SlotsResponse>(
        `${AANMELDEN}/api/v1/slots`,
        { auth: token, signal },
      );

      return {
        slots: payload.slots ?? [],
        members: payload.members ?? [],
        dates: (payload.registered_dates ?? []).map((date) => new Date(date)),
      };
    },
  });
}

/** Replaces the cached registration without a round-trip, for optimistic updates. */
function patchSlots(
  previous: Registration | undefined,
  update: (slots: Slot[]) => Slot[],
): Registration | undefined {
  if (!previous) return previous;
  return { ...previous, slots: update(previous.slots) };
}

export function useToggleRegistration() {
  const token = useTokenProvider();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async (slot: Slot) => {
      if (!token) return;

      const path = slot.is_registered ? "deregister" : "register";
      await action(
        `${AANMELDEN}/api/v1/${path}/${segment(slot.name)}/${segment(slot.pod)}`,
        token,
      );
    },
    onMutate: async (slot: Slot) => {
      // Flip the switch straight away; the refetch below confirms it.
      await queryClient.cancelQueries({ queryKey: keys.slots(scope) });
      const previous = queryClient.getQueryData<Registration>(
        keys.slots(scope),
      );

      queryClient.setQueryData<Registration>(keys.slots(scope), (current) =>
        patchSlots(current, (slots) =>
          slots.map((entry) =>
            entry.name === slot.name && entry.pod === slot.pod
              ? {
                  ...entry,
                  is_registered: !entry.is_registered,
                  available: entry.available + (entry.is_registered ? 1 : -1),
                  taken: entry.taken + (entry.is_registered ? -1 : 1),
                }
              : entry,
          ),
        ),
      );

      return { previous };
    },
    onError: (error, _slot, context) => {
      if (context?.previous)
        queryClient.setQueryData(keys.slots(scope), context.previous);
      showError("Aanmelden mislukt", error);
    },
    onSettled: () => {
      // Demo mode has no server to reconcile with; keep the optimistic state.
      if (token) invalidateRegistration(queryClient, scope);
    },
  });
}

export function useMarkSeen() {
  const token = useTokenProvider();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async ({
      presence,
      seen,
    }: {
      presence: Presence;
      seen: boolean;
    }) => {
      if (!token) return;

      await action(
        `${AANMELDEN}/api/v1/seen/${segment(presence.id)}/${seen ? "true" : "false"}`,
        token,
      );
    },
    onMutate: async ({ presence, seen }) => {
      await queryClient.cancelQueries({ queryKey: keys.slots(scope) });
      const previous = queryClient.getQueryData<Registration>(
        keys.slots(scope),
      );

      queryClient.setQueryData<Registration>(keys.slots(scope), (current) =>
        patchSlots(current, (slots) =>
          slots.map((slot) => ({
            ...slot,
            presence: slot.presence?.map((entry) =>
              entry.id === presence.id ? { ...entry, seen } : entry,
            ),
          })),
        ),
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(keys.slots(scope), context.previous);
      showError("Aanpassen mislukt", error);
    },
    onSettled: () => {
      if (token) invalidateRegistration(queryClient, scope);
    },
  });
}

export function useRegisterMember() {
  const token = useTokenProvider();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async ({ slot, member }: { slot: Slot; member: string }) => {
      if (!token) return;

      await action(
        `${AANMELDEN}/api/v1/register_manual/${segment(slot.name)}/${segment(slot.pod)}/${segment(member)}`,
        token,
      );
    },
    onError: (error) => showError("Aanmelden mislukt", error),
    onSettled: () => invalidateRegistration(queryClient, scope),
  });
}

export function useUpdateFutureDates() {
  const token = useTokenProvider();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async ({
      add,
      remove,
    }: {
      add: string[];
      remove: string[];
    }) => {
      if (!token) return;

      const message = errorFromBody(
        await requestText(`${AANMELDEN}/api/v1/future`, {
          method: "PATCH",
          auth: token,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ add, remove }),
        }),
      );
      if (message) throw new Error(message);
    },
    onError: (error) => showError("Opslaan mislukt", error),
    onSettled: () => invalidateRegistration(queryClient, scope),
  });
}

/** Shared by the mutations above and the live-reload socket. */
export function invalidateRegistration(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: string,
) {
  return queryClient.invalidateQueries({ queryKey: keys.slots(scope) });
}
