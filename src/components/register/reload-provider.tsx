import { ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { AANMELDEN } from "../../env";
import { Authed, useAuth } from "../../auth";
import { useScope } from "../../api/query";
import { invalidateRegistration } from "../../queries/register";
import logging from "../../logging";

/**
 * Aanmelden pushes a signal whenever the register changes. Rather than refetch
 * by hand, mark the registration query stale and let React Query decide whether
 * anything is still mounted and needs the data.
 */
export default function ReloadProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const scope = useScope();

  useEffect(() => {
    if (auth.authenticated !== Authed.AUTHENTICATED) return;

    const socket = io(AANMELDEN, { transports: ["websocket"] });
    socket.on("update_report_page", () => {
      logging.log("REGISTER", "Received live update");
      invalidateRegistration(queryClient, scope).then();
    });

    // The previous implementation never tore the socket down, leaving a
    // connection (and its listener) alive across logouts.
    return () => {
      socket.close();
    };
  }, [auth.authenticated, queryClient, scope]);

  return children;
}
