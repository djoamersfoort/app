import { RefreshControl, ScrollView, View } from "react-native";
import { UserContext } from "../auth/auth.jsx";
import Listing from "../aanmelden/listing";
import Feed from "../feed/feed";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { doneAtom, refreshingAtom } from "../feed/refresh";

export default function Home({ navigation }) {
  const [refreshing, setRefreshing] = useAtom(refreshingAtom);
  const [done, setDone] = useAtom(doneAtom);

  function refresh() {
    setDone(0);
    setRefreshing(true);
  }
  useEffect(() => {
    if (!refreshing) return;
    if (done < 3) return;

    setRefreshing(false);
  }, [done]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <UserContext.Consumer>
        {(user) => (
          <View style={styles.feed}>
            <Listing user={user} navigation={navigation} />
            <Feed user={user} navigation={navigation} />
          </View>
        )}
      </UserContext.Consumer>
    </ScrollView>
  );
}

const styles = {
  feed: {
    margin: 10,
    gap: 10,
  },
  card: {
    gap: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 5,
  },
};
