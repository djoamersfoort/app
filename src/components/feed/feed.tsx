import { useContext } from "react";
import AuthContext from "../../auth";
import { useAtomValue } from "jotai";
import { feedAtom } from "../../stores/feed";
import { ActivityIndicator, Card } from "react-native-paper";
import Item from "./item";
import Area from "../area";

export default function Feed() {
  const feed = useAtomValue(feedAtom);

  return (
    <Area title={"Nieuws"} icon={"bullhorn"}>
      {feed ? (
        feed.map((item, index) => <Item key={index} item={item} />)
      ) : (
        <ActivityIndicator animating={true} />
      )}
    </Area>
  );
}
