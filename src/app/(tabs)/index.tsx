import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { useArticles, useAnnouncements } from "@/queries/feed";
import { useRegistration } from "@/queries/register";
import { useAlbums } from "@/queries/media";
import { Authed, useAuth } from "@/auth";
import {
  ScreenHeader,
  HeaderIconButton,
  useTabBarInset,
} from "@/components/screen";
import SlotCards from "@/components/register/slot-cards";
import AlbumRow from "@/components/media/album-row";
import ArticleRow from "@/components/feed/article-row";
import Announcements from "@/components/feed/announcements";
import logging from "@/logging";

export default function HomeScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const tabBarInset = useTabBarInset();

  // The sections below use these same hooks; React Query dedupes them into one
  // request per key, so this only exists to drive pull-to-refresh.
  const registration = useRegistration();
  const albums = useAlbums();
  const articles = useArticles();
  const announcements = useAnnouncements();

  const authenticated = auth.authenticated === Authed.AUTHENTICATED;

  async function refresh() {
    logging.log("FEED", "Refreshing feed");

    setRefreshing(true);
    try {
      await Promise.all([
        registration.refetch(),
        articles.refetch(),
        announcements.refetch(),
        authenticated ? albums.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Box className="flex-1 bg-background">
      <ScreenHeader
        title="Home"
        subtitle={
          auth.authenticated === Authed.AUTHENTICATED
            ? `Hoi ${auth.user.given_name}`
            : "Welkom bij DJO"
        }
        action={
          <HStack className="items-center">
            <HeaderIconButton
              icon="magnify"
              label="Zoeken"
              onPress={() => router.push("/search")}
            />
            <HeaderIconButton
              icon="cog-outline"
              label="Instellingen"
              onPress={() => router.push("/settings")}
            />
          </HStack>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <VStack className="gap-9 pt-6">
          <SlotCards />
          {/* Media is member-only, matching the tab that hosts the full page. */}
          {authenticated && <AlbumRow />}
          <ArticleRow />
          <Announcements />
        </VStack>
      </ScrollView>
    </Box>
  );
}
