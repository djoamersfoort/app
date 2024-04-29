import { AlbumList, SmoelAlbumList } from "../../__generated__/media";
import { Image, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { StackParamList } from "../../../App";

type NavigationProps = NativeStackNavigationProp<StackParamList>;

export default function Preview({
  album,
  mode,
}: {
  album: AlbumList | SmoelAlbumList;
  mode: "smoel" | "album";
}) {
  const navigation = useNavigation<NavigationProps>();

  function navigate() {
    if (mode === "album") {
      navigation.navigate("Album", { album: album.id, title: album.name });
    } else {
      navigation.navigate("Smoel", { smoel: album.id, title: album.name });
    }
  }

  return (
    <TouchableOpacity style={styles.container} onPress={navigate}>
      <Image source={{ uri: album.preview?.cover_path }} style={styles.image} />
      <Text variant={"titleSmall"}>{album.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1 / 2,
    margin: 5,
    gap: 5,
  },
  image: {
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "lightgrey",
  },
});
