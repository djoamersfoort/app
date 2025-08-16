import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import { Image, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useEffect, useState } from "react";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import { Appbar, Button, Dialog, Portal, Text } from "react-native-paper";
import { useApi } from "../../stores/media";
import { User } from "../../__generated__/media";

type Props = StackScreenProps<StackParamList, "Slides">;
type NavigationProps = NavigationProp<StackParamList>;

export default function SlidesScreen({ route }: Props) {
  const { album, items, item } = route.params;
  const [page, setPage] = useState(item);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const api = useApi();
  const navigation = useNavigation<NavigationProps>();

  const [user, setUser] = useState<User>({ id: "", admin: false });
  useEffect(() => {
    (async () => {
      if (!api) return;

      const { data } = await api.users.getUser();
      setUser(data);
    })();
  }, [api]);

  function deleteItem() {
    setDeleteVisible(true);
  }

  async function confirmDelete() {
    if (!api || !album) return;

    await api.items.deleteItems(album, [items[page].id]);
    items.splice(page, 1);
    setDeleteVisible(false);
    navigation.goBack();
  }

  function cancelDelete() {
    setDeleteVisible(false);
  }

  async function setPreview() {
    if (!api || !album) return;

    await api.albums.setPreview(album, { item_id: items[page].id });
    setPreviewVisible(true);
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
            {user.admin && <Appbar.Action icon={"star"} onPress={setPreview} />}
            {(user.admin || items[page].user === user.id) && (
              <Appbar.Action icon={"trash-can"} onPress={deleteItem} />
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
                <Video
                  style={styles.image}
                  source={{ uri: item.path }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
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
            <Button onPress={cancelDelete}>Annuleer</Button>
            <Button onPress={confirmDelete}>Verwijder</Button>
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
