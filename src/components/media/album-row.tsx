import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { useAlbums } from "@/queries/media";
import Section from "../section";
import { IconButton, Placeholder } from "../screen";
import Preview from "./preview";

/** Home-screen media strip: the newest albums, with a jump to the full page. */
export default function AlbumRow() {
  const router = useRouter();
  const { data, isPending, error } = useAlbums();

  const albums = data?.slice(0, 10) ?? [];

  return (
    <Section
      title="Media"
      icon="image-multiple"
      action={
        <IconButton
          icon="arrow-right"
          label="Alle albums"
          onPress={() => router.push("/media")}
        />
      }
    >
      {isPending || albums.length === 0 ? (
        <Box className="px-4">
          <Placeholder
            isPending={isPending}
            error={error}
            icon="image-off-outline"
            empty="Er zijn nog geen albums"
            className="rounded-2xl border border-border bg-card"
          />
        </Box>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack className="gap-3 px-4">
            {albums.map((album) => (
              <Preview key={album.id} album={album} className="w-36" />
            ))}
          </HStack>
        </ScrollView>
      )}
    </Section>
  );
}
