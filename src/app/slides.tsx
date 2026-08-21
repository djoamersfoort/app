import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import {
  useAlbum,
  useDeleteItem,
  useMediaUser,
  useSetPreview,
} from "@/queries/media";
import { HeaderIconButton, Placeholder } from "@/components/screen";
import { numberParam, param } from "@/routes";

export default function SlidesScreen() {
  const params = useLocalSearchParams<{ album?: string; index?: string }>();
  const album = param(params.album);

  const [page, setPage] = useState(() => numberParam(params.index, 0));
  const [deleteVisible, setDeleteVisible] = useState(false);
  const router = useRouter();

  // The item list is read from the album query rather than passed through the
  // route, so a long album does not end up serialised into navigation state.
  const { data: albumData, isPending } = useAlbum(album);
  const { data: user } = useMediaUser();
  const deleteItem = useDeleteItem(album);
  const setPreviewItem = useSetPreview(album);

  const items = albumData?.items ?? [];
  const current = items[page];
  const admin = user?.admin ?? false;

  function confirmDelete() {
    if (!current) return;

    deleteItem.mutate(current.id, {
      // The album query is invalidated by the mutation, so the grid we return
      // to reloads without this screen having to patch its own params.
      onSuccess: () => router.back(),
      onSettled: () => setDeleteVisible(false),
    });
  }

  const header = (
    <Stack.Screen
      options={{
        title: current
          ? new Date(current.date).toLocaleDateString("nl-NL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        headerRight: () => (
          <>
            {admin && (
              <HeaderIconButton
                icon="star-outline"
                label="Als omslag instellen"
                onPress={() => current && setPreviewItem.mutate(current.id)}
              />
            )}
            {(admin || current?.user === user?.id) && (
              <HeaderIconButton
                icon="trash-can-outline"
                label="Verwijderen"
                onPress={() => setDeleteVisible(true)}
              />
            )}
          </>
        ),
      }}
    />
  );

  if (isPending || items.length === 0)
    return (
      <Box className="flex-1 bg-background">
        {header}
        <Placeholder
          isPending={isPending}
          icon="image-off-outline"
          empty="Er is niets om te tonen"
        />
      </Box>
    );

  function inRange(x: number, y: number, range: number) {
    return x >= y - range && x <= y + range;
  }

  return (
    <Box className="flex-1 bg-black">
      {header}
      <PagerView
        style={{ flex: 1 }}
        initialPage={page}
        onPageSelected={(event) => setPage(event.nativeEvent.position)}
      >
        {items.map((item, index) => (
          <View key={index}>
            {inRange(page, index, 1) &&
              (item.type === 1 ? (
                <Image style={styles.image} source={{ uri: item.path }} />
              ) : (
                <VideoView
                  style={styles.image}
                  player={useVideoPlayer(item.path, (video) => {
                    video.play();
                  })}
                  allowsFullscreen={true}
                />
              ))}
          </View>
        ))}
      </PagerView>

      <Actionsheet
        isOpen={deleteVisible}
        onClose={() => setDeleteVisible(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <VStack className="w-full gap-4 p-4">
            <VStack className="gap-1">
              <Heading size="md" className="text-foreground">
                Weet je zeker dat je dit wilt verwijderen?
              </Heading>
              <Text size="sm" className="text-muted-foreground">
                Deze actie kan niet ongedaan gemaakt worden.
              </Text>
            </VStack>

            <HStack className="gap-3">
              <Button
                variant="outline"
                onPress={() => setDeleteVisible(false)}
                isDisabled={deleteItem.isPending}
                className="flex-1 rounded-xl"
              >
                <ButtonText>Annuleer</ButtonText>
              </Button>
              <Button
                variant="destructive"
                onPress={confirmDelete}
                isDisabled={deleteItem.isPending}
                className="flex-1 rounded-xl"
              >
                {deleteItem.isPending && <ButtonSpinner />}
                <ButtonText>Verwijder</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </Box>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
