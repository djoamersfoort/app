import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import { Album } from "../../__generated__/media";
import { useApi } from "../../stores/media";
import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import {
  ActivityIndicator,
  Appbar,
  Dialog,
  Portal,
  Text,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { NativeStackNavigationEventMap } from "react-native-screens/lib/typescript/native-stack/types";
import * as ImagePicker from "expo-image-picker";
import AuthContext, { Authed } from "../../auth";

type Props = StackScreenProps<StackParamList, "Album">;
type NavigationProps = NativeStackNavigationProp<StackParamList>;

export default function AlbumScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProps>();
  const authState = useContext(AuthContext);
  const api = useApi();
  const [album, setAlbum] = useState<Album>();
  const [uploadVisible, setUploadVisible] = useState<boolean>(false);

  const [_cameraStatus, requestPermissions, getPermissions] =
    ImagePicker.useCameraPermissions();

  async function upload(images: ImagePicker.ImagePickerAsset[]) {
    if (authState.authenticated !== Authed.AUTHENTICATED || !api) return;

    setUploadVisible(true);
    const formData = new FormData();
    images.forEach((asset) => {
      // @ts-ignore
      formData.append("items", {
        uri: asset.uri,
        name: "file",
        type: asset.mimeType,
      });
    });

    await fetch(
      `https://media.djoamersfoort.nl/api/items/${route.params.album}`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${await authState.token}`,
        },
        body: formData,
      },
    );

    const { data } = await api.albums.getAlbum(route.params.album);
    setAlbum(data);
    setUploadVisible(false);
  }

  async function selectImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    await upload(result.assets);
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
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    await upload(result.assets);
  }

  useEffect(() => {
    async function fetchAlbum() {
      console.log(api);
      if (!api) return;

      navigation.setOptions({
        headerRight: () => (
          <>
            <Appbar.Action icon={"folder-image"} onPress={selectImages} />
            <Appbar.Action icon={"camera"} onPress={captureImages} />
          </>
        ),
      } as Partial<NativeStackNavigationEventMap>);

      navigation.addListener("focus", async () => {
        const { data: album } = await api.albums.getAlbum(route.params.album);
        setAlbum(album);
      });
      const { data: album } = await api.albums.getAlbum(route.params.album);
      setAlbum(album);
    }

    fetchAlbum().then();
  }, [api]);

  function openImage(image: number) {
    if (!album) return;

    navigation.navigate("Slides", {
      album: album.id,
      items: album.items,
      item: image,
    });
  }

  if (!album) return <ActivityIndicator animating={true} />;
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
        <Dialog visible={uploadVisible}>
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
});
