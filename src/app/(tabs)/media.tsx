import { FlatList } from "react-native";
import { Box } from "@/components/ui/box";
import Preview from "@/components/media/preview";
import { useAlbums } from "@/queries/media";
import { Placeholder, ScreenHeader, useTabBarInset } from "@/components/screen";

export default function MediaScreen() {
  // Refetches automatically when the app regains focus, so no manual
  // navigation "focus" listener is needed.
  const { data: albums, isPending, error } = useAlbums();
  const tabBarInset = useTabBarInset();

  return (
    <Box className="flex-1 bg-background">
      <ScreenHeader title="Media" subtitle="Foto's en video's van DJO" />

      {isPending || error ? (
        <Placeholder
          isPending={isPending}
          error={error}
          icon="image-off-outline"
        />
      ) : (
        <FlatList
          data={albums}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{
            gap: 16,
            paddingHorizontal: 16,
            paddingBottom: tabBarInset,
            paddingTop: 24,
          }}
          renderItem={({ item }) => <Preview album={item} className="flex-1" />}
          ListEmptyComponent={
            <Placeholder
              icon="image-off-outline"
              empty="Er zijn nog geen albums"
            />
          }
        />
      )}
    </Box>
  );
}
