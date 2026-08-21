import { ScrollView } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Sharing from "expo-sharing";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Authed, useAuth } from "@/auth";
import Section from "@/components/section";
import Icon from "@/components/icon";
import { Stack } from "expo-router";
import logging from "@/logging";

function Row({
  icon,
  title,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
}) {
  return (
    <Button
      variant="outline"
      onPress={onPress}
      className="h-auto justify-start gap-3 rounded-2xl px-4 py-3"
    >
      <Icon name={icon as never} size={20} className="text-primary" />
      <VStack className="flex-1 items-start">
        <ButtonText className="font-medium text-foreground">{title}</ButtonText>
        {!!description && (
          <Text size="xs" className="text-muted-foreground">
            {description}
          </Text>
        )}
      </VStack>
      <Icon name="chevron-right" size={20} className="text-muted-foreground" />
    </Button>
  );
}

export default function SettingsScreen() {
  const authState = useAuth();

  async function orderList() {
    await WebBrowser.openBrowserAsync(
      "https://docs.google.com/document/d/1cyrfqq37l9QdhByT1zExyk_W7TDEhyO6/edit",
    );
  }

  async function exportLog() {
    if (!logging.currentFile) return;
    await Sharing.shareAsync(logging.currentFile);
  }

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Instellingen" }} />

      <ScrollView>
        <VStack className="gap-9 pb-10 pt-6">
          <Section title="Account" icon="account">
            <Box className="px-4">
              <VStack className="gap-4 rounded-2xl border border-border bg-card p-4">
                {authState.authenticated === Authed.AUTHENTICATED && (
                  <>
                    <HStack className="items-center gap-3">
                      <Avatar className="bg-primary">
                        <AvatarFallbackText>
                          {`${authState.user.given_name} ${authState.user.family_name}`}
                        </AvatarFallbackText>
                      </Avatar>
                      <VStack className="flex-1">
                        <Heading size="sm" className="text-foreground">
                          {authState.user.given_name}{" "}
                          {authState.user.family_name}
                        </Heading>
                        <Text size="xs" className="text-muted-foreground">
                          {authState.user.email}
                        </Text>
                      </VStack>
                    </HStack>
                    <Button
                      variant="outline"
                      onPress={authState.logout}
                      className="rounded-xl"
                    >
                      <ButtonText>Log uit</ButtonText>
                    </Button>
                  </>
                )}

                {authState.authenticated === Authed.GUEST && (
                  <>
                    <HStack className="items-center gap-3">
                      <Box className="h-10 w-10 items-center justify-center rounded-full bg-accent">
                        <Icon
                          name="account-question"
                          size={20}
                          className="text-accent-foreground"
                        />
                      </Box>
                      <VStack className="flex-1">
                        <Heading size="sm" className="text-foreground">
                          Demo mode
                        </Heading>
                        <Text size="xs" className="text-muted-foreground">
                          Acties worden niet bewaard
                        </Text>
                      </VStack>
                    </HStack>
                    <Button onPress={authState.login} className="rounded-xl">
                      <ButtonText>Ga uit demo mode</ButtonText>
                    </Button>
                  </>
                )}
              </VStack>
            </Box>
          </Section>

          <Section title="Algemeen" icon="cog">
            <VStack className="gap-3 px-4">
              <Row
                icon="clipboard-list-outline"
                title="Bestellijst"
                description="Mis je iets in de inventaris?"
                onPress={orderList}
              />
            </VStack>
          </Section>

          <Section title="Diagnostiek" icon="bug-outline">
            <VStack className="gap-3 px-4">
              <Row
                icon="file-export-outline"
                title="Exporteer log"
                description="Deel het logbestand"
                onPress={exportLog}
              />
              <Row
                icon="delete-outline"
                title="Leeg log"
                description="Verwijder de opgeslagen regels"
                onPress={() => logging.clear()}
              />
            </VStack>
          </Section>
        </VStack>
      </ScrollView>
    </Box>
  );
}
