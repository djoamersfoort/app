import { useContext, useEffect, useState } from "react";
import AuthContext, { Authed } from "../../auth";
import { useAtom } from "jotai";
import { apiAtom, getApi } from "../../stores/media";
import { AlbumList } from "../../__generated__/media";
import { FlatList, StyleSheet, View } from "react-native";
import Preview from "../../components/media/preview";
import { Appbar, Button, Text } from "react-native-paper";

export default function MediaScreen() {
  const authState = useContext(AuthContext);
  const [api, setApi] = useAtom(apiAtom);
  const [albums, setAlbums] = useState<AlbumList[]>([]);

  useEffect(() => {
    if (authState.authenticated !== Authed.AUTHENTICATED) {
      return setApi(null);
    }

    authState.token.then((token) => {
      setApi(getApi(token));
    });
  }, [authState]);
  useEffect(() => {
    async function getAlbums() {
      if (!api) return;

      const { data: albums } = await api.albums.getAlbums();
      setAlbums(albums.sort((a, b) => a.order - b.order));
    }

    getAlbums().then();
  }, [api]);

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Media"} />
      </Appbar.Header>
      {authState.authenticated === Authed.GUEST && (
        <View style={styles.unauthenticated}>
          <Text>Je moet eerst inloggen om deze pagina te bekijken</Text>
          <Button mode={"contained-tonal"} onPress={authState.login}>
            Log in
          </Button>
        </View>
      )}
      {authState.authenticated === Authed.AUTHENTICATED && (
        <FlatList
          style={{ margin: 5 }}
          data={albums}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Preview album={item} />}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  unauthenticated: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: 5,
    padding: 20,
    textAlign: "center",
  },
});
