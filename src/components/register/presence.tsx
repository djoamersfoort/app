import {
  getSlots,
  Presence as PresenceType,
  Slot,
  slotsAtom,
} from "../../stores/register";
import { ActivityIndicator, Checkbox, Switch, Text } from "react-native-paper";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useContext, useState } from "react";
import AuthContext, { Authed } from "../../auth";
import { useAtom } from "jotai";
import { Platform } from "react-native";

export default function Presence({
  presence,
  slot,
}: {
  presence: PresenceType;
  slot: Slot;
}) {
  const [slots, setSlots] = useAtom(slotsAtom);
  const [seen, setSeen] = useState(presence.seen);
  const authState = useContext(AuthContext);

  async function markSeen() {
    if (authState.authenticated !== Authed.AUTHENTICATED) return;
    if (!slots) return;

    presence.seen = !presence.seen;
    setSeen(presence.seen);
    setSlots(slots);

    const token = await authState.token;
    await fetch(
      `https://aanmelden.djoamersfoort.nl/api/v1/seen/${presence.id}/${presence.seen ? "true" : "false"}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
  }

  return (
    <TouchableOpacity style={styles.presence} onPress={markSeen}>
      <Switch value={seen} onChange={markSeen} />
      <Text>{presence.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  presence: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
