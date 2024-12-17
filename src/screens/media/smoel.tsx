import { FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import { useEffect, useState } from "react";
import { useApi } from "../../stores/media";
import { SmoelAlbum } from "../../__generated__/media";
import { ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";

type Props = StackScreenProps<StackParamList, "Smoel">;
type NavigationProps = NativeStackNavigationProp<StackParamList>;

export default function Smoel({ route }: Props) {
  const navigation = useNavigation<NavigationProps>();
  const [smoel, setSmoel] = useState<SmoelAlbum>();
  const api = useApi();
  useEffect(() => {
    async function getSmoel() {
      if (!api) return;

      setSmoel(
        await api.smoelen.getSmoel(route.params.smoel).then(({ data }) => data),
      );
    }
    getSmoel().then();
  }, [api]);

  function openImage(image: number) {
    if (!smoel) return;

    navigation.navigate("Slides", { items: smoel.items, item: image });
  }

  if (!smoel) return <ActivityIndicator animating={true} />;
  return (
    <FlatList
      numColumns={3}
      initialNumToRender={3}
      data={smoel.items}
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
