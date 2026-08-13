import { ActivityIndicator, Text } from "react-native-paper";
import Item from "./item";
import Area from "../area";
import { useFeed } from "../../queries/feed";
import { errorMessage } from "../../api/errors";

export default function Feed() {
  const { items, isPending, error } = useFeed();

  return (
    <Area title={"Nieuws"} icon={"bullhorn"}>
      {isPending ? (
        <ActivityIndicator animating={true} />
      ) : items.length > 0 ? (
        <>
          {items.map((item, index) => (
            <Item key={index} item={item} />
          ))}
        </>
      ) : (
        // Both sources failed or returned nothing; say so instead of showing an
        // empty card that looks like a successful load.
        <Text>{error ? errorMessage(error) : "Geen nieuws op dit moment"}</Text>
      )}
    </Area>
  );
}
