import { useRouter } from "expo-router";
import { AlbumList } from "@/__generated__/media";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import Icon from "../icon";

/** An album tile. Width is left to the caller so it works in a row and a grid. */
export default function Preview({
  album,
  className,
}: {
  album: AlbumList;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Pressable
      className={`active:opacity-70 ${className ?? ""}`}
      onPress={() =>
        router.push({
          pathname: "/album/[album]",
          params: { album: album.id, title: album.name },
        })
      }
    >
      <VStack className="gap-2">
        <Box className="aspect-square w-full overflow-hidden rounded-2xl bg-secondary">
          {album.preview?.cover_path ? (
            <Image
              source={{ uri: album.preview.cover_path }}
              alt={album.name}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <Box className="h-full w-full items-center justify-center">
              <Icon
                name="image-off-outline"
                size={26}
                className="text-muted-foreground"
              />
            </Box>
          )}
        </Box>
        <Text
          size="sm"
          numberOfLines={1}
          className="font-medium text-foreground"
        >
          {album.name}
        </Text>
      </VStack>
    </Pressable>
  );
}
