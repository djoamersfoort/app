import { ReactNode, useContext, useEffect } from "react";
import AuthContext, { Authed } from "../../auth";
import { io } from "socket.io-client";
import { AANMELDEN } from "../../env";
import { getSlots } from "../../stores/register";

export default function ReloadProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const authState = useContext(AuthContext);

  useEffect(() => {
    const socket = io(AANMELDEN);

    socket.on("update_report_page", async () => {
      if (authState.authenticated !== Authed.AUTHENTICATED) return;

      await getSlots(await authState.token);
    });
  }, []);

  return children;
}
