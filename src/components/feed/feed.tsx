import { useAtomValue } from "jotai";
import { feedAtom } from "../../stores/feed";
import { ActivityIndicator } from "react-native-paper";
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
