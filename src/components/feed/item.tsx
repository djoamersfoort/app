import { ActionType, FeedItem } from "../../queries/feed";
import { TouchableOpacity } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Avatar, Card, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { encodeParam } from "../../routes";

export default function Item({ item }: { item: FeedItem }) {
  const router = useRouter();

  async function open() {
    switch (item.action.type) {
      case ActionType.LINK: {
        await WebBrowser.openBrowserAsync(item.action.href);
        break;
      }
      case ActionType.VIEW: {
        // Only the id: the announcement's HTML is read back from the feed cache.
        router.push({
          pathname: "/web",
          params: { id: item.action.id, title: item.title },
        });
        break;
      }
      case ActionType.ITEM: {
        router.push({
          pathname: "/item",
          params: { item: encodeParam(item.action.item), title: item.title },
        });
        break;
      }
      case ActionType.EVENT: {
        router.push({
          pathname: "/event",
          params: { event: encodeParam(item.action.event), title: item.title },
        });
      }
    }
  }

  return (
    <TouchableOpacity onPress={open}>
      <Card mode={"contained"}>
        <Card.Title
          title={item.title}
          subtitle={item.description}
          left={(props) =>
            item.icon.startsWith("http") ? (
              <Avatar.Image {...props} source={{ uri: item.icon }} />
            ) : (
              <Avatar.Icon {...props} icon={item.icon} />
            )
          }
          right={(props) => <IconButton {...props} icon={"chevron-right"} />}
        />
      </Card>
    </TouchableOpacity>
  );
}
