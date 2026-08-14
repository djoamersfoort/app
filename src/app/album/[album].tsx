import { Alert, FlatList } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { useAlbum, useUploadItems } from "@/queries/media";
import { HeaderIconButton, Placeholder } from "@/components/screen";
import { param } from "@/routes";

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

  // Declared as route options rather than pushed imperatively through
  // navigation.setOptions, which is the Expo Router way of doing this.
  const header = (
    <Stack.Screen
      options={{
        title: param(params.title),
        headerRight: () => (
          <>
            <HeaderIconButton
              icon="image-multiple-outline"
              label="Kies uit bibliotheek"
              onPress={selectImages}
            />
            <HeaderIconButton
              icon="camera-outline"
              label="Maak een foto"
              onPress={captureImages}
            />
          </>
        ),
      }}
    />
  );

  if (isPending || error || !album)
    return (
      <Box className="flex-1 bg-background">
        {header}
        <Placeholder
          isPending={isPending}
          error={error}
          icon="image-off-outline"
          empty="Dit album kon niet geladen worden"
        />
      </Box>
    );

  return (
    <Box className="flex-1 bg-background">
      {header}

      {upload.isPending && (
        <VStack className="items-center gap-2 border-b border-border bg-card px-4 py-3">
          <Spinner />
          <Text size="sm" className="text-muted-foreground">
            Bezig met uploaden, dit kan even duren...
          </Text>
        </VStack>
      )}

      <FlatList
        numColumns={3}
        initialNumToRender={12}
        data={album.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 3, padding: 3 }}
        columnWrapperStyle={{ gap: 3 }}
        renderItem={({ item, index }) => (
          <Pressable
            className="aspect-square flex-1 overflow-hidden rounded-lg active:opacity-70"
            onPress={() =>
              router.push({
                pathname: "/slides",
                params: { album: album.id, index },
              })
            }
          >
            <Image
              source={{ uri: item.cover_path }}
              alt=""
              className="h-full w-full"
              resizeMode="cover"
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <Center className="py-16">
            <Text className="text-muted-foreground">Dit album is nog leeg</Text>
          </Center>
        }
      />
    </Box>
  );
}
