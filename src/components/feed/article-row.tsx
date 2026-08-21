import { ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { FeedItem, useArticles } from "@/queries/feed";
import Section from "../section";
import Icon from "../icon";
import { Placeholder } from "../screen";
import { useOpenFeedItem } from "./actions";

/**
 * The card is a single element rather than a Pressable wrapping a styled inner
 * view: the row stretches its direct children to the tallest one, but that
 * stretch does not pass through to a nested wrapper, which is what left the
 * cards at uneven heights.
 */
function ArticleCard({ item }: { item: FeedItem }) {
  const open = useOpenFeedItem();

  return (
    <Pressable
      onPress={() => open(item)}
      className="w-64 gap-2 rounded-2xl border border-border bg-card p-4 active:opacity-70"
    >
      <Box className="h-9 w-9 items-center justify-center rounded-full bg-accent">
        <Icon name="post" size={18} className="text-accent-foreground" />
      </Box>

      <Text
        numberOfLines={3}
        className="font-semibold leading-snug text-foreground"
      >
        {item.title}
      </Text>
      <Text size="xs" numberOfLines={2} className="text-muted-foreground">
        {item.description}
      </Text>

      {!!item.date && (
        <Text size="xs" className="mt-auto pt-1 text-muted-foreground">
          {new Date(item.date).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
          })}
        </Text>
      )}
    </Pressable>
  );
}

/** Home-screen article strip, sourced from the public RSS feed. */
export default function ArticleRow() {
  const { data, isPending, error } = useArticles();
  const articles = data?.slice(0, 10) ?? [];

  return (
    <Section title="Artikelen" icon="post">
      {isPending || articles.length === 0 ? (
        <Box className="px-4">
          <Placeholder
            isPending={isPending}
            error={error}
            icon="post-outline"
            empty="Geen artikelen gevonden"
            className="rounded-2xl border border-border bg-card"
          />
        </Box>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack className="items-stretch gap-3 px-4">
            {articles.map((item, index) => (
              <ArticleCard key={index} item={item} />
            ))}
          </HStack>
        </ScrollView>
      )}
    </Section>
  );
}
