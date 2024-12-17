import { useApi } from "../../stores/media";
import { AlbumList } from "../../__generated__/media";
import { useEffect, useState } from "react";
import { FlatList } from "react-native";
import Preview from "./preview";
import { ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

export default function Albums() {
  const [albums, setAlbums] = useState<AlbumList[] | null>(null);
  const api = useApi();
  const navigation = useNavigation();

  useEffect(() => {
    async function getAlbums() {
      if (!api) return;

      const { data: albums } = await api.albums.getAlbums();
      setAlbums(albums.sort((a, b) => a.order - b.order));
    }

    navigation.addListener("focus", getAlbums);

    getAlbums().then();
  }, [api]);

  if (!albums) return <ActivityIndicator animating={true} />;
  return (
    <FlatList
      style={{ margin: 5 }}
      data={albums}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Preview mode={"album"} album={item} />}
    />
  );
}
