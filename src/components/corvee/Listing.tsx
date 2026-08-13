import { Button, Card } from "react-native-paper";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";
import {
  CorveeAction,
  CorveeProfile,
  useCorveeAction,
} from "../../queries/corvee";
import { errorMessage } from "../../api/errors";

export default function Listing({ selected }: { selected: CorveeProfile }) {
  // Which button is spinning; the mutation itself only knows that one is.
  const [pending, setPending] = useState<CorveeAction | null>(null);
  const corveeAction = useCorveeAction();

  function action(id: string, action: CorveeAction) {
    return async function () {
      setPending(action);
      try {
        await corveeAction.mutateAsync({ id, action });
      } catch (error) {
        Alert.alert("Actie mislukt", errorMessage(error));
      } finally {
        setPending(null);
      }
    };
  }

  return (
    <Card key={selected.id}>
      <Card.Cover
        style={{ aspectRatio: 1, height: undefined }}
        source={{ uri: selected.picture }}
      />
      <Card.Title title={`${selected.first_name} ${selected.last_name}`} />
      <Card.Actions>
        <ScrollView horizontal={true}>
          <View style={styles.actions}>
            <Button
              loading={pending === CorveeAction.ACKNOWLEDGE}
              disabled={!!pending}
              onPress={action(selected.id, CorveeAction.ACKNOWLEDGE)}
              mode={"contained"}
            >
              Aftekenen
            </Button>
            <Button
              loading={pending === CorveeAction.ABSENT}
              disabled={!!pending}
              onPress={action(selected.id, CorveeAction.ABSENT)}
              mode={"contained-tonal"}
            >
              Afwezig
            </Button>
            <Button
              loading={pending === CorveeAction.INSUFFICIENT}
              disabled={!!pending}
              onPress={action(selected.id, CorveeAction.INSUFFICIENT)}
              mode={"contained-tonal"}
            >
              Onvoldoende
            </Button>
          </View>
        </ScrollView>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
  },
});
