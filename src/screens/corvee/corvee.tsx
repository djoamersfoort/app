import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Icon, Text } from "react-native-paper";
import { useCorveeStatus } from "../../queries/corvee";
import { useRegistration } from "../../queries/register";
import Create from "../../components/corvee/Create";
import Selected from "../../components/corvee/Selected";
import { errorMessage } from "../../api/errors";

export default function CorveeScreen() {
  const status = useCorveeStatus();
  const registration = useRegistration();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([status.refetch(), registration.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  const state = status.data;

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
              {state.current.length === 0 && <Create state={state} />}
              {state.current.length > 0 && <Selected state={state} />}
            </>
          )}
          {state && "error" in state && (
            <View style={styles.error}>
              <Icon size={75} source={"emoticon-happy"} />
              <Text variant={"titleMedium"}>{state.error}</Text>
            </View>
          )}
          {/* A failed request is not the same as "niets te doen"; show why. */}
          {!state && status.isError && (
            <View style={styles.error}>
              <Icon size={75} source={"cloud-off-outline"} />
              <Text variant={"titleMedium"}>{errorMessage(status.error)}</Text>
            </View>
          )}
          {!state && !status.isError && <ActivityIndicator animating={true} />}
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
