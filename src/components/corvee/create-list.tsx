import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import PresenceCard from "../register/presence-card";
import { useRegistration } from "../../queries/register";
import { CorveeState, useCreateCorvee } from "../../queries/corvee";

export default function Create({ state }: { state: CorveeState }) {
  const { data } = useRegistration();
  const createCorvee = useCreateCorvee();
  const theme = useTheme();

  const slot = data?.slots.find(
    (slot) => slot.pod === state.pod && slot.name === state.day,
  );

  if (!slot) return null;

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
        <PresenceCard slot={slot} members={data?.members ?? []} />
      </View>
      <Button
        mode={"contained"}
        onPress={() => createCorvee.mutate()}
        loading={createCorvee.isPending}
        disabled={createCorvee.isPending}
      >
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
