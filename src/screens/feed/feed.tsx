import { Appbar } from "react-native-paper";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Listing from "../../components/register/listing";
import Feed from "../../components/feed/feed";
import { useContext, useEffect, useState } from "react";
import { useAtom } from "jotai";
import {
  feedAtom,
  getAnnouncements,
  getRSSFeed,
  sortFeeds,
} from "../../stores/feed";
import { getSlots, slotsAtom, membersAtom } from "../../stores/register";
import AuthContext, { Authed } from "../../auth";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { StackParamList } from "../../../App";
import { useNavigation } from "@react-navigation/native";
import logging from "../../logging";

type NavigationProps = NativeStackNavigationProp<StackParamList, "Search">;

export default function FeedScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [refreshing, setRefreshing] = useState(false);

  const authState = useContext(AuthContext);
  const [_feed, setFeed] = useAtom(feedAtom);
  const [_slots, setSlots] = useAtom(slotsAtom);
  const [_members, setMembers] = useAtom(membersAtom);

  async function loadData() {
    const token =
      authState.authenticated === Authed.AUTHENTICATED
        ? await authState.token
        : null;
    logging.log(
      "FEED",
      `Auth state ${authState.authenticated}, token is ${token ? "defined" : "undefined"}`,
    );

    await Promise.all([
      new Promise<void>(async (resolve) => {
        setSlots(null);

        await getSlots(token);
        resolve();
      }),
      new Promise<void>(async (resolve) => {
        setFeed(null);
        const feeds = await Promise.all([
          getRSSFeed(),
          getAnnouncements(token),
        ]);
        setFeed(sortFeeds(...feeds));
        resolve();
      }),
    ]);
  }

  useEffect(() => {
    logging.log("FEED", "Loading initial data");

    loadData().then();
  }, []);

  async function refresh() {
    logging.log("FEED", "Refreshing feed");

    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Home"} />
        <Appbar.Action
          icon={"magnify"}
          onPress={() => navigation.navigate("Search")}
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
