import { Appbar } from "react-native-paper";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Listing from "../../components/register/slot-list";
import Feed from "../../components/feed/news";
import { useState } from "react";
import { useFeed } from "../../queries/feed";
import { useRegistration } from "../../queries/register";
import { useRouter } from "expo-router";
import logging from "../../logging";

export default function FeedScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Both hooks are also used by the children below; React Query dedupes them
  // into a single request per key.
  const registration = useRegistration();
  const feed = useFeed();

  async function refresh() {
    logging.log("FEED", "Refreshing feed");

    setRefreshing(true);
    try {
      await Promise.all([registration.refetch(), feed.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Home"} />
        <Appbar.Action
          icon={"magnify"}
          onPress={() => router.push("/search")}
        />
      </Appbar.Header>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.container}>
          <Listing />
          <Feed />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 10,
  },
});
