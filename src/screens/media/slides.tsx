import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import { Image, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";

type Props = StackScreenProps<StackParamList, "Slides">;

export default function SlidesScreen({ route }: Props) {
  const { items, item } = route.params;
  const [page, setPage] = useState(item);
  const navigation = useNavigation();

  useEffect(() => {
    const title = new Date(items[page].date).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    navigation.setOptions({
      title,
    });
  }, [page]);

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
