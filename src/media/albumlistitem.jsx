import { Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";

export default function AlbumListItem({ album, navigation }) {
  function onPress() {
    navigation.navigate("Album", { album: album.id, title: album.name });
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: album.preview?.cover_path }} style={styles.image} />
      <Text variant={"titleSmall"}>{album.name}</Text>
    </TouchableOpacity>
  );
}

const styles = {
  container: {
    flex: 1 / 2,
    margin: 5,
    gap: 5,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "lightgrey",
  },
};
