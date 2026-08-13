import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CORVEE } from "../env";
import { requestJson, requestVoid, segment } from "../api/client";
import { keys, useScope } from "../api/query";
import { showError } from "../api/errors";
import { Authed, useAuth, useTokenProvider } from "../auth";

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

/** Not a failure: the API reports "nothing to do today" through this shape. */
export interface CorveeUnavailable {
  error: string;
  ok: false;
}

export type CorveeStatus = CorveeState | CorveeUnavailable;

export enum CorveeAction {
  ACKNOWLEDGE = "ack",
  ABSENT = "absent",
  INSUFFICIENT = "insuff",
}

export function useCorveeStatus() {
  const auth = useAuth();
  const token = useTokenProvider();
  const scope = useScope();

  return useQuery({
    queryKey: keys.corveeStatus(scope),
    enabled: auth.authenticated === Authed.AUTHENTICATED,
    queryFn: ({ signal }) =>
      requestJson<CorveeStatus>(`${CORVEE}/api/v1/status`, {
        auth: token!,
        signal,
      }),
  });
}

export function useCorveeAction() {
  const token = useTokenProvider();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: CorveeAction;
    }) => {
      if (!token) return;

      await requestVoid(`${CORVEE}/api/v1/${action}/${segment(id)}`, {
        auth: token,
      });
    },
    onError: (error) => showError("Actie mislukt", error),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: keys.corveeStatus(scope) }),
  });
}

export function useCreateCorvee() {
  const token = useTokenProvider();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async () => {
      if (!token) return;

      await requestVoid(`${CORVEE}/api/v1/renew`, { auth: token });
    },
    onError: (error) => showError("Aanmaken mislukt", error),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: keys.corveeStatus(scope) }),
  });
}
