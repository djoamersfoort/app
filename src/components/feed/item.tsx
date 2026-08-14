import { FeedItem } from "@/queries/feed";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import Icon from "../icon";
import { useOpenFeedItem } from "./actions";

/** A full-width feed row: leading icon, title, description, chevron. */
export default function Item({ item }: { item: FeedItem }) {
  const open = useOpenFeedItem();

  return (
    <Pressable
      onPress={() => open(item)}
      className="rounded-2xl border border-border bg-card p-3 active:opacity-70"
    >
      <HStack className="items-center gap-3">
        {item.icon.startsWith("http") ? (
          <Image
            source={{ uri: item.icon }}
            alt={item.title}
            className="h-11 w-11 rounded-full"
          />
        ) : (
          <Box className="h-11 w-11 items-center justify-center rounded-full bg-accent">
            <Icon
              name={item.icon as never}
              size={20}
              className="text-accent-foreground"
            />
          </Box>
        )}

        <VStack className="flex-1">
          <Text
            numberOfLines={2}
            className="font-semibold leading-snug text-foreground"
          >
            {item.title}
          </Text>
          {!!item.description && (
            <Text size="sm" numberOfLines={2} className="text-muted-foreground">
              {item.description}
            </Text>
          )}
        </VStack>

        <Icon
          name="chevron-right"
          size={22}
          className="text-muted-foreground"
        />
      </HStack>
    </Pressable>
  );
}
