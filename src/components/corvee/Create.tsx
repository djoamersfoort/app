import { StyleSheet, View } from "react-native";
import PresenceCard from "../register/precenseCard";
import { useAtom, useAtomValue } from "jotai";
import { membersAtom, Slot, slotsAtom } from "../../stores/register";
import { getStatus, stateAtom } from "../../stores/corvee";
import { useContext, useEffect, useState } from "react";
import { Button, Text, useTheme } from "react-native-paper";
import { CORVEE } from "../../env";
import AuthContext, { Authed } from "../../auth";

export default function Create() {
  const slots = useAtomValue(slotsAtom);
  const members = useAtomValue(membersAtom);
  const [state, setState] = useAtom(stateAtom);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const authState = useContext(AuthContext);

  const [slot, setSlot] = useState<Slot>();

  useEffect(() => {
    if (!slots || !state) return setSlot(undefined);

    setSlot(
      slots.find((slot) => slot.pod === state.pod && slot.name === state.day),
    );
  }, [slots, state]);

  async function create() {
    if (authState.authenticated !== Authed.AUTHENTICATED) return;

    setLoading(true);
    const token = await authState.token;
    await fetch(`${CORVEE}/api/v1/renew`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const state = await getStatus(token);
    setLoading(false);
    setState(state);
  }

  if (!slot) return;

  return (
    <>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        <Text variant={"titleMedium"} style={styles.text}>
          Wie is er aanwezig?
        </Text>
        <PresenceCard slot={slot} members={members} />
      </View>
      <Button mode={"contained"} onPress={create} loading={loading}>
        Maak lijst aan
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
    marginBottom: 15,
  },
  card: {
    padding: 15,
    borderRadius: 15,
    flexGrow: 1,
  },
});
