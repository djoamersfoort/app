import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import Preview from "./preview";
import { useAlbums } from "../../queries/media";
import { errorMessage } from "../../api/errors";

export default function Albums() {
  // Refetches automatically when the app regains focus, so the manual
  // navigation "focus" listener is no longer needed.
  const { data: albums, isPending, error } = useAlbums();

  if (isPending) return <ActivityIndicator animating={true} />;
  if (error)
    return (
      <View style={styles.message}>
        <Text>{errorMessage(error)}</Text>
      </View>
    );

  return (
    <FlatList
      style={{ margin: 5 }}
      data={albums}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Preview album={item} />}
      ListEmptyComponent={
        <View style={styles.message}>
          <Text>Er zijn nog geen albums</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  message: {
    padding: 20,
    alignItems: "center",
  },
});
