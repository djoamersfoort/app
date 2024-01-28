import { Card } from "react-native-paper";
import { useEffect } from "react";
import SlotListing from "./slotlisting";
import { useAtom } from "jotai";
import { getSlots, slotsAtom } from "./slots";
import { doneAtom, refreshingAtom } from "../feed/refresh";

export default function Listing({ user, navigation }) {
  const [slots, setSlots] = useAtom(slotsAtom);
  const [refreshing] = useAtom(refreshingAtom);
  const [done, setDone] = useAtom(doneAtom);
  useEffect(() => {
    setSlots(getSlots(user));
  }, [user]);

  useEffect(() => {
    if (!refreshing) return;

    getSlots(user).then((slots) => {
      setSlots(slots);
      setDone(done + 1);
    });
  });

  return (
    <Card>
      <Card.Title title={"Aanmelden"} />
      <Card.Content style={styles.content}>
        {slots.map((slot, i) => (
          <SlotListing
            key={i}
            slot={slot}
            slotId={i}
            user={user}
            navigation={navigation}
          />
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = {
  content: {
    gap: 10,
  },
};
