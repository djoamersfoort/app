import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useCorveeStatus } from "@/queries/corvee";
import { useRegistration } from "@/queries/register";
import CreateList from "@/components/corvee/create-list";
import ProfileCard from "@/components/corvee/profile-card";
import Icon from "@/components/icon";
import { Placeholder, ScreenHeader, useTabBarInset } from "@/components/screen";

export default function CorveeScreen() {
  const status = useCorveeStatus();
  const registration = useRegistration();
  const [refreshing, setRefreshing] = useState(false);
  const tabBarInset = useTabBarInset();

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([status.refetch(), registration.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  const state = status.data;
  const done = state && "error" in state;

  return (
    <Box className="flex-1 bg-background">
      <ScreenHeader title="Corvee" subtitle="Wie ruimt er vandaag op?" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarInset }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <VStack className="flex-1 gap-4 px-4 pt-6">
          {state && !done && (
            <>
              {state.current.length === 0 && <CreateList state={state} />}
              {state.current.map((profile) => (
                <ProfileCard key={profile.id} selected={profile} />
              ))}
            </>
          )}

          {/* The API reports "nothing to do today" through an error field. */}
          {done && (
            <Center className="flex-1 gap-3">
              <Box className="h-16 w-16 items-center justify-center rounded-full bg-accent">
                <Icon
                  name="emoticon-happy-outline"
                  size={32}
                  className="text-accent-foreground"
                />
              </Box>
              <Heading size="sm" className="text-center text-foreground">
                {state.error}
              </Heading>
              <Text size="sm" className="text-center text-muted-foreground">
                Er staat niets open.
              </Text>
            </Center>
          )}

          {!state && (
            <Placeholder
              isPending={status.isPending}
              error={status.error}
              icon="cloud-off-outline"
              className="flex-1"
            />
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
