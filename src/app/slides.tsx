import { Image, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ActivityIndicator,
  Appbar,
  Button,
  Dialog,
  Portal,
  Text,
} from "react-native-paper";
import {
  useAlbum,
  useDeleteItem,
  useMediaUser,
  useSetPreview,
} from "../queries/media";
import { numberParam, param } from "../routes";

export default function SlidesScreen() {
  const params = useLocalSearchParams<{ album?: string; index?: string }>();
  const album = param(params.album);

  const [page, setPage] = useState(() => numberParam(params.index, 0));
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const router = useRouter();

  // The item list is read from the album query rather than passed through the
  // route, so a long album does not end up serialised into navigation state.
  const { data: albumData, isPending } = useAlbum(album);
  const { data: user } = useMediaUser();
  const deleteItem = useDeleteItem(album);
  const setPreviewItem = useSetPreview(album);

  const items = albumData?.items ?? [];
  const current = items[page];
  const admin = user?.admin ?? false;

  function confirmDelete() {
    if (!current) return;

    deleteItem.mutate(current.id, {
      // The album query is invalidated by the mutation, so the grid we return
      // to reloads without this screen having to patch its own params.
      onSuccess: () => router.back(),
      onSettled: () => setDeleteVisible(false),
    });
  }

  function setPreview() {
    if (!current) return;

    setPreviewItem.mutate(current.id, {
      onSuccess: () => setPreviewVisible(true),
    });
  }

  const header = (
    <Stack.Screen
      options={{
        title: current
          ? new Date(current.date).toLocaleDateString("nl-NL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        headerRight: () => (
          <>
            {admin && <Appbar.Action icon={"star"} onPress={setPreview} />}
            {(admin || current?.user === user?.id) && (
              <Appbar.Action
                icon={"trash-can"}
                onPress={() => setDeleteVisible(true)}
              />
            )}
          </>
        ),
      }}
    />
  );

  if (isPending)
    return (
      <View style={styles.center}>
        {header}
        <ActivityIndicator animating={true} />
      </View>
    );

  if (items.length === 0)
    return (
      <View style={styles.center}>
        {header}
        <Text>Er is niets om te tonen</Text>
      </View>
    );

  function inRange(x: number, y: number, range: number) {
    return x >= y - range && x <= y + range;
  }

  return (
    <View style={{ flex: 1 }}>
      {header}
      <PagerView
        style={{ flex: 1 }}
        initialPage={page}
        onPageSelected={(event) => setPage(event.nativeEvent.position)}
      >
        {items.map((item, index) => (
          <View key={index}>
            {inRange(page, index, 1) &&
              (item.type === 1 ? (
                <Image style={styles.image} source={{ uri: item.path }} />
              ) : (
                <VideoView
                  style={styles.image}
                  player={useVideoPlayer(item.path, (video) => {
                    video.play();
                  })}
                  allowsFullscreen={true}
                />
              ))}
          </View>
        ))}
      </PagerView>

      <Portal>
        <Dialog
          visible={deleteVisible}
          onDismiss={() => setDeleteVisible(false)}
        >
          <Dialog.Title>
            Weet je zeker dat je dit wilt verwijderen?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Deze actie kan niet ongedaan gemaakt worden!
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDeleteVisible(false)}
              disabled={deleteItem.isPending}
            >
              Annuleer
            </Button>
            <Button onPress={confirmDelete} loading={deleteItem.isPending}>
              Verwijder
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={previewVisible}
          onDismiss={() => setPreviewVisible(false)}
        >
          <Dialog.Title>Preview ingesteld!</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={() => setPreviewVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
