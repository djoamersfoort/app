import { useContext } from "react";
import AuthContext from "../../auth";
import { useAtomValue } from "jotai";
import { feedAtom } from "../../stores/feed";
import { ActivityIndicator, Card } from "react-native-paper";
import Item from "./item";

export default function Feed() {
  const feed = useAtomValue(feedAtom);

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
