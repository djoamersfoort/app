import { AlbumList } from "../../__generated__/media";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";

export default function Preview({ album }: { album: AlbumList }) {
  const router = useRouter();

  function navigate() {
    router.push({
      pathname: "/album/[album]",
      params: { album: album.id, title: album.name },
    });
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
