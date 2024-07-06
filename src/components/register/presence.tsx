import {
  Presence as PresenceType,
  Slot,
  slotsAtom,
} from "../../stores/register";
import { Icon, Switch, Text } from "react-native-paper";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useContext, useState } from "react";
import AuthContext, { Authed } from "../../auth";
import { useAtom } from "jotai";
import { AANMELDEN } from "../../env";

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
      `${AANMELDEN}/api/v1/seen/${presence.id}/${presence.seen ? "true" : "false"}`,
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
      {!!presence.stripcard_count && (
        <View style={styles.stripcard}>
          <Icon size={22} source={"clipboard-list"} />
          <Text>
            {presence.stripcard_used} / {presence.stripcard_count}
          </Text>
        </View>
      )}
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
  stripcard: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
  },
});
