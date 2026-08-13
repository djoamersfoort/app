import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Appbar,
  Dialog,
  Portal,
  Text,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useAlbum, useUploadItems } from "../../queries/media";
import { errorMessage } from "../../api/errors";
import { param } from "../../routes";

export default function AlbumScreen() {
  const params = useLocalSearchParams<{ album?: string; title?: string }>();
  const albumId = param(params.album);

  const router = useRouter();
  const { data: album, isPending, error } = useAlbum(albumId);
  const upload = useUploadItems(albumId);

  const [_cameraStatus, requestPermissions, getPermissions] =
    ImagePicker.useCameraPermissions();

  async function selectImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos", "livePhotos"],
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    upload.mutate(result.assets);
  }

  async function captureImages() {
    const permissions = await getPermissions();
    if (!permissions.granted) {
      if (!permissions.canAskAgain)
        return Alert.alert(
          "Camera permissions denied!",
          "Change permissions in your device's settings",
        );

      const result = await requestPermissions();
      if (!result.granted)
        return Alert.alert(
          "Camera permissions denied!",
          "Change permissions in your device's settings",
        );
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos", "livePhotos"],
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    upload.mutate(result.assets);
  }

  function openImage(image: number) {
    if (!album) return;

    // Only the album id and the index travel in the route; the items stay in
    // the query cache instead of being serialised into navigation state.
    router.push({
      pathname: "/slides",
      params: { album: album.id, index: image },
    });
  }

  // Declared as route options rather than pushed imperatively through
  // navigation.setOptions, which is the Expo Router way of doing this.
  const header = (
    <Stack.Screen
      options={{
        title: param(params.title),
        headerRight: () => (
          <>
            <Appbar.Action icon={"folder-image"} onPress={selectImages} />
            <Appbar.Action icon={"camera"} onPress={captureImages} />
          </>
        ),
      }}
    />
  );

  if (isPending)
    return (
      <>
        {header}
        <ActivityIndicator animating={true} />
      </>
    );
  if (error || !album)
    return (
      <View style={styles.message}>
        {header}
        <Text>{errorMessage(error)}</Text>
      </View>
    );

  return (
    <>
      {header}
      <FlatList
        numColumns={3}
        initialNumToRender={3}
        data={album.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => openImage(index)}
          >
            <Image source={{ uri: item.cover_path }} style={styles.image} />
          </TouchableOpacity>
        )}
      />
      <Portal>
        <Dialog visible={upload.isPending}>
          <Dialog.Title>Uploaden...</Dialog.Title>
          <Dialog.Content>
            <ActivityIndicator animating={true} />
            <Text variant="bodyMedium">
              Bezig met uploaden, dit kan even duren...
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1 / 3,
    aspectRatio: 1,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
  },
  message: {
    padding: 20,
    alignItems: "center",
  },
});
