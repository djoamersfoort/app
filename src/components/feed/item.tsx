import { ActionType, FeedItem } from "../../stores/feed";
import { TouchableOpacity } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Avatar, Card, IconButton } from "react-native-paper";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { StackParamList } from "../../../App";

type NavigationProps = NavigationProp<StackParamList>;

export default function Item({ item }: { item: FeedItem }) {
  const navigation = useNavigation<NavigationProps>();

  async function open() {
    switch (item.action.type) {
      case ActionType.LINK: {
        await WebBrowser.openBrowserAsync(item.action.href);
        break;
      }
      case ActionType.VIEW: {
        navigation.navigate("Web", {
          source: item.action.source,
          title: item.title,
        });
        break;
      }
      case ActionType.ITEM: {
        navigation.navigate("Item", {
          item: item.action.item,
          title: item.title,
        });
        break;
      }
      case ActionType.EVENT: {
        navigation.navigate("Event", {
          event: item.action.event,
          title: item.title,
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
