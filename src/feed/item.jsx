import { Avatar, Card, IconButton } from "react-native-paper";
import { TouchableOpacity } from "react-native";

export default function Item({ item, navigation, styles }) {
  function open() {
    const source = { ...item.source };
    if (item.addStyles) source.html = `<style>${styles}</style>${source.html}`;

    navigation.navigate("WebView", { title: item.page, source });
  }

  return (
    <TouchableOpacity onPress={open}>
      <Card mode={"contained"}>
        <Card.Title
          title={item.title}
          subtitle={item.description}
          left={(props) => <Avatar.Icon {...props} icon={item.icon} />}
          right={(props) => <IconButton {...props} icon={"chevron-right"} />}
        />
      </Card>
    </TouchableOpacity>
  );
}
