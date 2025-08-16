import { Button, Card } from "react-native-paper";
import { ScrollView, StyleSheet, View } from "react-native";
import { CorveeProfile, getStatus, stateAtom } from "../../stores/corvee";
import { useContext, useState } from "react";
import AuthContext, { Authed } from "../../auth";
import { CORVEE } from "../../env";
import { useSetAtom } from "jotai";

enum Action {
  ACKNOWLEDGE = "ack",
  ABSENT = "absent",
  INSUFFICIENT = "insuff",
}

export default function Listing({ selected }: { selected: CorveeProfile }) {
  const [loading, setLoading] = useState<Set<Action>>(new Set());
  const setState = useSetAtom(stateAtom);
  const authState = useContext(AuthContext);

  function action(id: string, action: Action) {
    return async function () {
      if (authState.authenticated !== Authed.AUTHENTICATED) return;

      setLoading(loading.add(action));

      const token = await authState.token;
      await fetch(`${CORVEE}/api/v1/${action}/${id}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const state = await getStatus(token);
      setState(state);

      loading.delete(action);
      setLoading(loading);
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
              loading={loading.has(Action.ACKNOWLEDGE)}
              onPress={action(selected.id, Action.ACKNOWLEDGE)}
              mode={"contained"}
            >
              Aftekenen
            </Button>
            <Button
              loading={loading.has(Action.ABSENT)}
              onPress={action(selected.id, Action.ABSENT)}
              mode={"contained-tonal"}
            >
              Afwezig
            </Button>
            <Button
              loading={loading.has(Action.INSUFFICIENT)}
              onPress={action(selected.id, Action.INSUFFICIENT)}
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
