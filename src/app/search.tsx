import {
  ActivityIndicator,
  Button,
  Icon,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Item from "../components/feed/item";
import * as WebBrowser from "expo-web-browser";
import Area from "../components/area";
import { useArticleSearch, useItemSearch } from "../queries/search";
import { FeedItem } from "../queries/feed";
import { errorMessage } from "../api/errors";

/** Renders one result section, including its loading and failure states. */
function Results({
  results,
  isPending,
  error,
  empty,
}: {
  results: FeedItem[] | undefined;
  isPending: boolean;
  error: unknown;
  empty: React.ReactElement;
}) {
  if (isPending) return <ActivityIndicator animating={true} />;
  if (error)
    return (
      <View style={styles.center}>
        <Text>{errorMessage(error)}</Text>
      </View>
    );
  if (!results || results.length === 0) return empty;

  return (
    <>
      {results.map((result, index) => (
        <Item key={index} item={result} />
      ))}
    </>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  // Only the submitted term drives the queries, so typing does not fire a
  // request per keystroke.
  const [query, setQuery] = useState("");
  const router = useRouter();

  const items = useItemSearch(query);
  const articles = useArticleSearch(query);

  async function orderList() {
    await WebBrowser.openBrowserAsync(
      "https://docs.google.com/document/d/1cyrfqq37l9QdhByT1zExyk_W7TDEhyO6/edit",
    );
  }

  return (
    <>
      <SafeAreaView style={styles.view}>
        <View
          style={{
            ...styles.component,
            backgroundColor: theme.colors.background,
          }}
        >
          <Searchbar
            placeholder="Search"
            onChangeText={setSearch}
            onSubmitEditing={() => setQuery(search)}
            icon={"chevron-left"}
            onIconPress={router.back}
            value={search}
          />
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View
            style={{
              ...styles.component,
              ...styles.results,
            }}
          >
            {!!query && (
              <>
                <Area title={"Inventaris"} icon={"package-variant-closed"}>
                  <Results
                    results={items.data}
                    isPending={items.isPending}
                    error={items.error}
                    empty={
                      <View style={styles.center}>
                        <Text>Geen producten gevonden</Text>
                        <Button onPress={orderList} mode={"text"}>
                          Mis je iets? Bekijk de bestellijst
                        </Button>
                      </View>
                    }
                  />
                </Area>
                <Area title={"Artikelen"} icon={"post"}>
                  <Results
                    results={articles.data}
                    isPending={articles.isPending}
                    error={articles.error}
                    empty={
                      <View style={styles.center}>
                        <Text>Geen artikelen gevonden</Text>
                      </View>
                    }
                  />
                </Area>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {!query && (
        <View style={styles.start}>
          <Icon size={75} source={"magnify"} />
          <Text>Zoek naar artikelen en items in de inventaris</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    flexDirection: "column",
    height: "100%",
  },
  component: {
    padding: 10,
  },
  results: {
    paddingBottom: 10,
    gap: 10,
  },
  content: {
    gap: 10,
  },
  center: {
    alignItems: "center",
  },
  start: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
});
