import { useAtom } from "jotai";
import { apiAtom } from "../../stores/media";
import { SmoelAlbumList } from "../../__generated__/media";
import { useEffect, useState } from "react";
import { FlatList } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Preview from "./preview";

export default function Smoelen() {
  const [smoelen, setSmoelen] = useState<SmoelAlbumList[] | null>(null);
  const [api] = useAtom(apiAtom);

  useEffect(() => {
    async function getSmoelen() {
      if (!api) return;

      const { data: albums } = await api.smoelen.getSmoelen();
      setSmoelen(albums);
    }

    getSmoelen().then();
  }, [api]);

  if (!smoelen) return <ActivityIndicator animating={true} />;
  return (
    <FlatList
      style={{ margin: 5 }}
      data={smoelen}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Preview mode={"smoel"} album={item} />}
    />
  );
}
