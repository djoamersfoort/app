import {
  ActivityIndicator,
  Button,
  Card,
  Icon,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ActionType, FeedItem } from "../../stores/feed";
import Item from "../../components/feed/item";
import { parse } from "fast-html-parser";
import * as WebBrowser from "expo-web-browser";

export interface Item {
  id: number;
  name: string;
  description: string;
  location: string;
  location_description: string;
  location_id: 7;
  url: string;
  properties: string[];
}

interface Article {
  id: string;
  title: string;
  url: string;
  _embedded: {
    self: [
      {
        excerpt: {
          rendered: string;
        };
      },
    ];
  };
}

async function getItems(query: string) {
  const { items }: { items: Item[] } = await fetch(
    `https://inventory.djoamersfoort.nl/api/v1/items/search/${encodeURI(query)}`,
  ).then((res) => res.json());

  return items.map(
    (item) =>
      ({
        title: item.name,
        description: item.location_description,
        icon: "package-variant-closed",
        action: {
          type: ActionType.ITEM,
          item,
        },
      }) as FeedItem,
  );
}

async function getArticles(query: string) {
  const articles: Article[] = await fetch(
    `https://djoamersfoort.nl/wp-json/wp/v2/search?_embed&search=${encodeURI(query)}`,
  ).then((res) => res.json());

  return articles.map((article) => {
    const excerpt = parse(article._embedded.self[0].excerpt.rendered);

    const result: FeedItem = {
      title: article.title,
      description: excerpt.querySelector("p")?.text || "",
      icon: "post",
      action: {
        type: ActionType.LINK,
        href: article.url,
      },
    };

    return result;
  });
}

export default function SearchScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const navigation = useNavigation();

  const [itemResults, setItemsResults] = useState<FeedItem[] | null>(null);
  const [articleResults, setArticleResults] = useState<FeedItem[] | null>(null);
  const [searched, setSearched] = useState(false);

  async function updateResults() {
    setSearched(!!search);
    if (!search) return;

    setItemsResults(null);
    setArticleResults(null);

    getItems(search).then(setItemsResults);
    getArticles(search).then(setArticleResults);
  }

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
            onSubmitEditing={updateResults}
            icon={"chevron-left"}
            onIconPress={navigation.goBack}
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
            {searched && (
              <>
                <Card>
                  <Card.Title title={"Inventaris"} />
                  <Card.Content style={styles.content}>
                    {itemResults ? (
                      itemResults.length > 0 ? (
                        itemResults.map((result, index) => (
                          <Item key={index} item={result} />
                        ))
                      ) : (
                        <View style={styles.center}>
                          <Text>Geen producten gevonden</Text>
                          <Button onPress={orderList} mode={"text"}>
                            Mis je iets? Bekijk de bestellijst
                          </Button>
                        </View>
                      )
                    ) : (
                      <ActivityIndicator animating={true} />
                    )}
                  </Card.Content>
                </Card>
                <Card>
                  <Card.Title title={"Artikelen"} />
                  <Card.Content style={styles.content}>
                    {articleResults ? (
                      articleResults.length > 0 ? (
                        articleResults.map((result, index) => (
                          <Item key={index} item={result} />
                        ))
                      ) : (
                        <View style={styles.center}>
                          <Text>Geen artikelen gevonden</Text>
                        </View>
                      )
                    ) : (
                      <ActivityIndicator animating={true} />
                    )}
                  </Card.Content>
                </Card>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {!searched && (
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
