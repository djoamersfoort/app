import { Presence as PresenceType, useMarkSeen } from "../../queries/register";
import { Icon, Switch, Text } from "react-native-paper";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function Presence({ presence }: { presence: PresenceType }) {
  const markSeen = useMarkSeen();

  // The switch flips immediately through the optimistic cache update and rolls
  // back on failure, so no local copy of `seen` is needed here.
  const toggle = () => markSeen.mutate({ presence, seen: !presence.seen });

  return (
    <TouchableOpacity style={styles.presence} onPress={toggle}>
      <Switch value={presence.seen} onValueChange={toggle} />
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
