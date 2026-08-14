import { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useRegistration, useToggleRegistration } from "@/queries/register";
import { Authed, useAuth } from "@/auth";
import PresenceCard from "@/components/register/presence-card";
import Icon from "@/components/icon";
import { Placeholder } from "@/components/screen";
import { numberParam, param } from "@/routes";

function Detail({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <VStack className="gap-2 rounded-2xl border border-border bg-card p-4">
      <HStack className="items-center gap-2">
        <Icon name={icon as never} size={16} className="text-primary" />
        <Text
          size="xs"
          className="uppercase tracking-wide text-muted-foreground"
        >
          {title}
        </Text>
      </HStack>
      {children}
    </VStack>
  );
}

export default function SlotScreen() {
  const params = useLocalSearchParams<{ slot?: string; title?: string }>();
  const title = param(params.title);
  const index = numberParam(params.slot, -1);

  // Hooks run unconditionally: the previous version returned early when the
  // slots had not loaded yet, which changed the hook order between renders.
  const { data, isPending } = useRegistration();
  const toggleRegistration = useToggleRegistration();
  const authState = useAuth();

  const slot = index >= 0 ? data?.slots[index] : undefined;
  const members = data?.members ?? [];

  // The header title comes from the route params, so it is declared in every
  // branch rather than only in the loaded one.
  const header = <Stack.Screen options={{ title }} />;

  if (isPending || !slot)
    return (
      <Box className="flex-1 bg-background">
        {header}
        <Placeholder
          isPending={isPending}
          icon="calendar-remove"
          empty="Deze dag kon niet geladen worden"
        />
      </Box>
    );

  const total = slot.available + slot.taken;
  const tutor =
    authState.authenticated === Authed.AUTHENTICATED &&
    authState.user.account_type.includes("begeleider");
  const blocked = !slot.is_registered && slot.available === 0 && !tutor;

  return (
    <Box className="flex-1 bg-background">
      {header}
      <SafeAreaView style={{ flex: 1 }} edges={["right", "bottom", "left"]}>
        <ScrollView>
          <VStack className="gap-3 p-4">
            <VStack className="gap-3 rounded-2xl bg-primary p-4">
              <Heading size="lg" className="capitalize text-primary-foreground">
                {new Date(slot.date).toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Heading>
              <HStack className="gap-2">
                <Badge variant="secondary" className="rounded-full">
                  <BadgeText className="normal-case">
                    {slot.available}/{total} vrij
                  </BadgeText>
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  <BadgeText className="normal-case">
                    {slot.is_registered ? "Aangemeld" : "Afwezig"}
                  </BadgeText>
                </Badge>
              </HStack>
            </VStack>

            {authState.authenticated === Authed.AUTHENTICATED &&
              authState.user.stripcard && (
                <Detail title="Strippenkaart" icon="clipboard-list">
                  <Text className="text-foreground">
                    Je strippenkaart is {authState.user.stripcard.used} van de{" "}
                    {authState.user.stripcard.count} keer gebruikt.
                  </Text>
                </Detail>
              )}

            {!!slot.announcement && (
              <Detail title="Aankondiging" icon="bullhorn">
                <Text className="text-foreground">{slot.announcement}</Text>
              </Detail>
            )}

            <Detail title="Begeleiders" icon="account-supervisor">
              {slot.tutors.length === 0 ? (
                <Text className="text-muted-foreground">
                  Er zijn nog geen begeleiders aangemeld
                </Text>
              ) : (
                <HStack className="flex-wrap gap-2">
                  {slot.tutors.map((name) => (
                    <Badge
                      key={name}
                      variant="secondary"
                      className="rounded-full"
                    >
                      <BadgeText className="normal-case">{name}</BadgeText>
                    </Badge>
                  ))}
                </HStack>
              )}
            </Detail>

            {slot.presence && (
              <Detail title="Leden" icon="account-details">
                <PresenceCard slot={slot} members={members} />
              </Detail>
            )}
          </VStack>
        </ScrollView>

        <Box className="border-t border-border bg-background p-4">
          <Button
            size="lg"
            variant={slot.is_registered ? "outline" : "default"}
            isDisabled={toggleRegistration.isPending || blocked}
            onPress={() => toggleRegistration.mutate(slot)}
            className="rounded-2xl"
          >
            {toggleRegistration.isPending && <ButtonSpinner />}
            <ButtonText>
              {slot.is_registered ? "Afmelden" : "Aanmelden"}
            </ButtonText>
          </Button>
        </Box>
      </SafeAreaView>
    </Box>
  );
}
