import { FlatList } from "react-native";
import { useEffect, useState } from "react";
import { UserContext } from "../auth/auth.jsx";
import AlbumListItem from "../media/albumlistitem";
import { MEDIA_API_BASE } from "../env";

function AlbumList({ user, navigation }) {
  let [items, setItems] = useState([]);
  useEffect(() => {
    fetch(`${MEDIA_API_BASE}/albums`, {
      headers: {
        authorization: "Bearer " + user.tokens.id_token,
      },
    })
      .then((res) => res.json())
      .then((res) => setItems(res.sort((a, b) => a.order - b.order)));
  }, []);

  return (
    <FlatList
      style={styles.grid}
      data={items}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AlbumListItem navigation={navigation} album={item} />
      )}
    />
  );
}

export default function Media({ navigation }) {
  return (
    <UserContext.Consumer>
      {(user) => <AlbumList user={user} navigation={navigation} />}
    </UserContext.Consumer>
  );
}

// grid with 2 columns
const styles = {
  grid: {
    margin: 5,
  },
  preview: {
    resizeMode: "cover",
  },
  card: {
    margin: 5,
    flex: 1,
  },
};
