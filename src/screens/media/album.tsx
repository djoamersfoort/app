import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import {
  ActivityIndicator,
  Appbar,
  Dialog,
  Portal,
  Text,
} from "react-native-paper";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAlbum, useUploadItems } from "../../queries/media";
import { errorMessage } from "../../api/errors";

type Props = StackScreenProps<StackParamList, "Album">;
type NavigationProps = NavigationProp<StackParamList>;

export default function AlbumScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProps>();
  const { data: album, isPending, error } = useAlbum(route.params.album);
  const upload = useUploadItems(route.params.album);

  const [_cameraStatus, requestPermissions, getPermissions] =
    ImagePicker.useCameraPermissions();

  async function submit(images: ImagePicker.ImagePickerAsset[]) {
    try {
      await upload.mutateAsync(images);
    } catch (uploadError) {
      Alert.alert("Uploaden mislukt", errorMessage(uploadError));
    }
  }

  async function selectImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos", "livePhotos"],
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    await submit(result.assets);
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

    await submit(result.assets);
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>
          <Appbar.Action icon={"folder-image"} onPress={selectImages} />
          <Appbar.Action icon={"camera"} onPress={captureImages} />
        </>
      ),
    });
  }, [navigation]);

  function openImage(image: number) {
    if (!album) return;

    navigation.navigate("Slides", {
      album: album.id,
      items: album.items,
      item: image,
    });
  }

  if (isPending) return <ActivityIndicator animating={true} />;
  if (error || !album)
    return (
      <View style={styles.message}>
        <Text>{errorMessage(error)}</Text>
      </View>
    );

  return (
    <>
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
