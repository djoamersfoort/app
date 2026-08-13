import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Text } from "react-native-paper";
import Preview from "../../components/media/preview";
import { useAlbums } from "../../queries/media";
import { errorMessage } from "../../api/errors";

export default function MediaScreen() {
  // Refetches automatically when the app regains focus, so no manual
  // navigation "focus" listener is needed.
  const { data: albums, isPending, error } = useAlbums();

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Media"} />
      </Appbar.Header>

      {isPending && <ActivityIndicator animating={true} />}
      {!isPending && error && (
        <View style={styles.message}>
          <Text>{errorMessage(error)}</Text>
        </View>
      )}
      {!isPending && !error && (
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
      )}
    </>
  );
}

const styles = StyleSheet.create({
  message: {
    padding: 20,
    alignItems: "center",
  },
});
