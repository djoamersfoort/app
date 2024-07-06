import { ReactNode, useContext, useEffect, useMemo } from "react";
import AuthContext, { Authed } from "../../auth";
import { io } from "socket.io-client";
import { AANMELDEN } from "../../env";
import { useSetAtom } from "jotai/index";
import { getSlots, membersAtom, slotsAtom } from "../../stores/register";

export default function ReloadProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const authState = useContext(AuthContext);

  const setSlots = useSetAtom(slotsAtom);
  const setMembers = useSetAtom(membersAtom);
  useEffect(() => {
    const socket = io(AANMELDEN);

    socket.on("update_report_page", async () => {
      if (authState.authenticated !== Authed.AUTHENTICATED) return;

      const { slots, members } = await getSlots(await authState.token);
      setSlots(slots);
      if (members) setMembers(members);
    });
  }, []);

  return children;
}
