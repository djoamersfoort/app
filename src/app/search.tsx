import { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { useArticleSearch, useItemSearch } from "@/queries/search";
import Item from "@/components/feed/item";
import Section from "@/components/section";
import Icon from "@/components/icon";
import { Placeholder } from "@/components/screen";
import SearchField from "@/components/search-field";
import { FeedItem } from "@/queries/feed";

function Results({
  results,
  isPending,
  error,
  empty,
  icon,
  footer,
}: {
  results: FeedItem[] | undefined;
  isPending: boolean;
  error: unknown;
  empty: string;
  icon: string;
  footer?: React.ReactNode;
}) {
  if (isPending || error || !results || results.length === 0)
    return (
      <VStack className="gap-2">
        <Placeholder
          isPending={isPending}
          error={error}
          icon={icon}
          empty={empty}
          className="rounded-2xl border border-border bg-card"
        />
        {!isPending && !error && footer}
      </VStack>
    );

  return (
    <VStack className="gap-3">
      {results.map((result, index) => (
        <Item key={index} item={result} />
      ))}
    </VStack>
  );
}

export default function SearchScreen() {
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
    <Box className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "right", "left"]}>
        <HStack className="items-center gap-2 px-4 py-3">
          <Pressable
            onPress={router.back}
            accessibilityLabel="Terug"
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
          >
            <Icon name="chevron-left" size={26} className="text-foreground" />
          </Pressable>

          <SearchField
            className="flex-1"
            placeholder="Zoek artikelen en inventaris"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setQuery(search.trim())}
            returnKeyType="search"
          />
        </HStack>

        {!query ? (
          <Center className="flex-1 gap-3 px-8">
            <Box className="h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Icon
                name="magnify"
                size={32}
                className="text-accent-foreground"
              />
            </Box>
            <Text className="text-center text-muted-foreground">
              Zoek naar artikelen en items in de inventaris
            </Text>
          </Center>
        ) : (
          <ScrollView>
            <VStack className="gap-9 pb-10 pt-6">
              <Section title="Inventaris" icon="package-variant-closed">
                <Box className="px-4">
                  <Results
                    results={items.data}
                    isPending={items.isPending}
                    error={items.error}
                    icon="package-variant"
                    empty="Geen producten gevonden"
                    footer={
                      <Button
                        variant="link"
                        onPress={orderList}
                        className="self-center"
                      >
                        <ButtonText>
                          Mis je iets? Bekijk de bestellijst
                        </ButtonText>
                      </Button>
                    }
                  />
                </Box>
              </Section>

              <Section title="Artikelen" icon="post">
                <Box className="px-4">
                  <Results
                    results={articles.data}
                    isPending={articles.isPending}
                    error={articles.error}
                    icon="post-outline"
                    empty="Geen artikelen gevonden"
                  />
                </Box>
              </Section>
            </VStack>
          </ScrollView>
        )}
      </SafeAreaView>
    </Box>
  );
}
