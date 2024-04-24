import { AlbumList } from "../../__generated__/media";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { StackParamList } from "../../../App";

type NavigationProps = NativeStackNavigationProp<StackParamList>;

export default function Preview({ album }: { album: AlbumList }) {
  const navigation = useNavigation<NavigationProps>();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        navigation.navigate("Album", { album: album.id, title: album.name })
      }
    >
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
