import {useContext, useEffect} from "react";
import AuthContext, {Authed} from "../../auth";
import {useAtom} from "jotai";
import {ActionType, feedAtom, getAnnouncements, getRSSFeed, sortFeeds,} from "../../stores/feed";
import {ActivityIndicator, Card} from "react-native-paper";
import Item from "./item";
import {Asset} from "expo-asset";

export default function Feed() {
  const authState = useContext(AuthContext);
  const [feed, setFeed] = useAtom(feedAtom);

  useEffect(() => {
    async function getFeeds() {
      const feeds = await Promise.all([
          getRSSFeed(),
          getAnnouncements(authState.authenticated === Authed.AUTHENTICATED ? await authState.token : null),
        ]);
        setFeed(sortFeeds(...feeds))
    }

    getFeeds().then();
  }, [authState]);

  return (
    <Card>
      <Card.Title title={"Nieuws"} />
      <Card.Content style={{ gap: 10 }}>
        {feed ? (
          feed.map((item, index) => <Item key={index} item={item} />)
        ) : (
          <ActivityIndicator animating={true} />
        )}
      </Card.Content>
    </Card>
  );
}
