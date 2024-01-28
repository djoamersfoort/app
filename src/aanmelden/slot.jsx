import { Button, Card, Chip, Text } from "react-native-paper";
import { View } from "react-native";
import { useState } from "react";
import { getSlots, slotsAtom } from "./slots";
import { useAtom } from "jotai";
import { AANMELDEN_API_BASE } from "../env";

export default function Slot({ route, navigation }) {
  const { user, slotId } = route.params;
  const [slots, setSlots] = useAtom(slotsAtom);
  const [slot, setSlot] = useState(slots[slotId]);
  const [loading, setLoading] = useState(false);

  async function register() {
    setLoading(true);
    const res = await fetch(
      `${AANMELDEN_API_BASE}/v1/${slot.is_registered ? "deregister" : "register"}/${slot.name}/${slot.pod}`,
      {
        headers: {
          authorization: `Bearer ${user.tokens.id_token}`,
        },
      },
    );
    const data = await res.json();

    if (data.error) {
      setLoading(false);
      return alert(data.error);
    }
    const slots = await getSlots(user);

    setSlots(slots);
    setSlot(slots[slotId]);
    setLoading(false);
  }

  return (
    <View style={styles.pod}>
      <View style={styles.data}>
        <Text variant={"titleMedium"}>Beschikbaarheid</Text>
        <Card>
          <Card.Content style={styles.list}>
            <Text variant={"titleSmall"}>
              Er zijn {slot.available}/{slot.available + slot.taken} plekken
              beschikbaar.
            </Text>
          </Card.Content>
        </Card>
        <Text variant={"titleMedium"}>Begeleiders</Text>
        <Card>
          <Card.Content style={styles.list}>
            {slot.tutors.map((tutor) => (
              <Chip key={tutor}>{tutor}</Chip>
            ))}
          </Card.Content>
        </Card>
      </View>
      <View style={styles.part}>
        <Button
          labelStyle={{ fontSize: 17 }}
          disabled={loading}
          loading={loading}
          onPress={register}
          style={styles.button}
          contentStyle={{ height: 50 }}
          mode={slot.is_registered ? "outlined" : "contained"}
        >
          {slot.is_registered ? "Afmelden" : "Aanmelden"}
        </Button>
      </View>
    </View>
  );
}

const styles = {
  pod: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    margin: 15,
  },
  data: {
    gap: 10,
  },
  center: {
    textAlign: "center",
  },
  part: {
    gap: 5,
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  button: {
    borderRadius: 25,
  },
};
