import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import { Alert, Image, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useEffect, useState } from "react";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Appbar, Button, Dialog, Portal, Text } from "react-native-paper";
import {
  useDeleteItem,
  useMediaUser,
  useSetPreview,
} from "../../queries/media";
import { errorMessage } from "../../api/errors";

type Props = StackScreenProps<StackParamList, "Slides">;
type NavigationProps = NavigationProp<StackParamList>;

export default function SlidesScreen({ route }: Props) {
  const { album, items, item } = route.params;
  const [page, setPage] = useState(item);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const navigation = useNavigation<NavigationProps>();

  const { data: user } = useMediaUser();
  const deleteItem = useDeleteItem(album ?? "");
  const setPreviewItem = useSetPreview(album ?? "");

  const admin = user?.admin ?? false;

  function askDelete() {
    setDeleteVisible(true);
  }

  async function confirmDelete() {
    if (!album) return;

    try {
      await deleteItem.mutateAsync(items[page].id);
      setDeleteVisible(false);
      // The album query is invalidated by the mutation, so the grid we return
      // to reloads without this screen having to patch its own params.
      navigation.goBack();
    } catch (error) {
      setDeleteVisible(false);
      Alert.alert("Verwijderen mislukt", errorMessage(error));
    }
  }

  function cancelDelete() {
    setDeleteVisible(false);
  }

  async function setPreview() {
    if (!album) return;

    try {
      await setPreviewItem.mutateAsync(items[page].id);
      setPreviewVisible(true);
    } catch (error) {
      Alert.alert("Instellen mislukt", errorMessage(error));
    }
  }

  useEffect(() => {
    const title = new Date(items[page].date).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    navigation.setOptions({
      title,
      headerRight: () =>
        album && (
          <>
            {admin && <Appbar.Action icon={"star"} onPress={setPreview} />}
            {(admin || items[page].user === user?.id) && (
              <Appbar.Action icon={"trash-can"} onPress={askDelete} />
            )}
          </>
        ),
    });
  }, [page, user]);

  function inRange(x: number, y: number, range: number) {
    return x >= y - range && x <= y + range;
  }

  return (
    <View style={{ flex: 1 }}>
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
        <Dialog visible={deleteVisible} onDismiss={cancelDelete}>
          <Dialog.Title>
            Weet je zeker dat je dit wilt verwijderen?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Deze actie kan niet ongedaan gemaakt worden!
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete} disabled={deleteItem.isPending}>
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
  container: {
    flex: 1,
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
