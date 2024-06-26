import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import { Album } from "../../__generated__/media";
import { useAtom } from "jotai";
import { apiAtom } from "../../stores/media";
import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import { ActivityIndicator, Appbar } from "react-native-paper";
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
  const [api] = useAtom(apiAtom);
  const [album, setAlbum] = useState<Album>();

  const [_cameraStatus, requestPermissions, getPermissions] =
    ImagePicker.useCameraPermissions();

  async function upload(images: ImagePicker.ImagePickerAsset[]) {
    if (authState.authenticated !== Authed.AUTHENTICATED || !api) return;

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
      if (!api) return;

      navigation.setOptions({
        headerRight: () => (
          <>
            <Appbar.Action icon={"folder-image"} onPress={selectImages} />
            <Appbar.Action icon={"camera"} onPress={captureImages} />
          </>
        ),
      } as Partial<NativeStackNavigationEventMap>);
      const { data: album } = await api.albums.getAlbum(route.params.album);
      setAlbum(album);
    }

    fetchAlbum().then();
  }, [api]);

  function openImage(image: number) {
    if (!album) return;

    navigation.navigate("Slides", { items: album.items, item: image });
  }

  if (!album) return <ActivityIndicator animating={true} />;
  return (
    <FlatList
      numColumns={3}
      initialNumToRender={3}
      data={album.items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <TouchableOpacity style={styles.item} onPress={() => openImage(index)}>
          <Image source={{ uri: item.cover_path }} style={styles.image} />
        </TouchableOpacity>
      )}
    />
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
