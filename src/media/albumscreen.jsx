import { UserContext } from "../auth/auth.jsx";
import { useEffect, useState } from "react";
import { Text } from "react-native-paper";
import { FlatList, Image, TouchableOpacity } from "react-native";
import { MEDIA_API_BASE } from "../env";

function AlbumScreen({ user, albumId, navigation }) {
  const [album, setAlbum] = useState(null);
  function refreshAlbum() {
    fetch(`${MEDIA_API_BASE}/albums/${albumId}`, {
      headers: {
        authorization: `Bearer ${user.tokens.id_token}`,
      },
    })
      .then((res) => res.json())
      .then((album) => setAlbum(album));
  }

  useEffect(() => {
    refreshAlbum();
  }, [albumId]);

  function openItem(item) {
    navigation.navigate("Item", { item, items: album.items });
  }

  if (!album) return <Text>Loading...</Text>;
  return (
    <FlatList
      numColumns={3}
      data={album.items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <TouchableOpacity style={styles.item} onPress={() => openItem(index)}>
          <Image source={{ uri: item.cover_path }} style={styles.image} />
        </TouchableOpacity>
      )}
    />
  );
}

export default function Screen({ route, navigation }) {
  const { album } = route.params;

  return (
    <UserContext.Consumer>
      {(user) => (
        <AlbumScreen user={user} albumId={album} navigation={navigation} />
      )}
    </UserContext.Consumer>
  );
}

const styles = {
  item: {
    flex: 1 / 3,
    aspectRatio: 1,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
  },
};
