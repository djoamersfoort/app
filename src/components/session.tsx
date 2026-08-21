import { ReactNode, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Authed, useAuth } from "../auth";
import { usePushRegistration } from "../queries/notifications";
import logging from "../logging";

function identityOf(authenticated: number, sub?: string) {
  if (authenticated === Authed.AUTHENTICATED) return sub ?? null;
  if (authenticated === Authed.GUEST) return "guest";
  return null;
}

/**
 * Ties the React Query cache to the session.
 *
 * Query keys are already scoped per account, but cached responses would still
 * sit in memory after a logout. Clearing on every identity change guarantees
 * that no personal data survives into the next session.
 */
export default function SessionProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const identity = useRef<string | null | undefined>(undefined);

  usePushRegistration();

  useEffect(() => {
    const current = identityOf(
      auth.authenticated,
      auth.authenticated === Authed.AUTHENTICATED ? auth.user.sub : undefined,
    );

    if (identity.current !== undefined && identity.current !== current) {
      logging.log("SESSION", "Account changed, clearing cache");
      queryClient.clear();
    }

    identity.current = current;
  }, [auth, queryClient]);

  return children;
}
