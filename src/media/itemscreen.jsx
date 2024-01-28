import { Image, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import * as React from "react";
import { useState } from "react";
import PagerView from "react-native-pager-view";

export default function ItemScreen({ route, navigation }) {
  const { item, items } = route.params;

  const [page, setPage] = useState(item);
  function onPageSelected(e) {
    setPage(e.nativeEvent.position);

    const title = new Date(
      items[e.nativeEvent.position].date,
    ).toLocaleDateString("en-us", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    navigation.setOptions({
      title,
    });
  }

  function inRange(x, y, range) {
    return x >= y - range && x <= y + range;
  }

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        style={{ flex: 1 }}
        initialPage={item}
        onPageSelected={onPageSelected}
      >
        {items.map((item, index) => (
          <View key={index}>
            {inRange(page, index, 1) &&
              (item.type === 1 ? (
                <Image source={{ uri: item.path }} style={styles.image} />
              ) : item.type === 2 ? (
                <Video
                  style={styles.image}
                  source={{ uri: item.path }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                />
              ) : null)}
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
};
