import { useContext, useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { getSlots, membersAtom, slotsAtom } from "../../stores/register";
import AuthContext, { Authed } from "../../auth";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Icon, Text } from "react-native-paper";
import { getStatus, stateAtom } from "../../stores/corvee";
import Create from "../../components/corvee/Create";
import Selected from "../../components/corvee/Selected";

export default function CorveeScreen() {
  const [state, setState] = useAtom(stateAtom);
  const setMembers = useSetAtom(membersAtom);
  const [refreshing, setRefreshing] = useState(false);
  const [slots, setSlots] = useAtom(slotsAtom);
  const authState = useContext(AuthContext);

  useEffect(() => {
    async function fetchDetails() {
      if (authState.authenticated !== Authed.AUTHENTICATED) return;

      const token = await authState.token;
      await Promise.all([
        !slots && getSlots(token),
        getStatus(token).then(setState),
      ]);
    }

    fetchDetails().then();
  }, []);

  async function refresh() {
    if (authState.authenticated !== Authed.AUTHENTICATED) return;

    setRefreshing(true);

    const token = await authState.token;
    await Promise.all([getSlots(token), getStatus(token).then(setState)]);

    setRefreshing(false);
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Corvee"} />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.content}>
          {state && !("error" in state) && (
            <>
              {state.current.length === 0 && <Create />}
              {state.current.length > 0 && <Selected />}
            </>
          )}
          {state && "error" in state && (
            <View style={styles.error}>
              <Icon size={75} source={"emoticon-happy"} />
              <Text variant={"titleMedium"}>{state.error}</Text>
            </View>
          )}
          {!state && <ActivityIndicator animating={true} />}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    display: "flex",
    flexGrow: 1,
    padding: 10,
    gap: 10,
  },
  error: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "static",
    flex: 1,
    gap: 20,
  },
});
