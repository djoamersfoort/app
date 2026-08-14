import { Alert, ScrollView } from "react-native";
import {
  deserializeComponent,
  SerializedComponent,
  VEvent,
} from "unfucked-ical";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Placeholder } from "@/components/screen";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { convert } from "html-to-text";
import {
  format,
  isFriday,
  isSameDay,
  isSaturday,
  nextFriday,
  nextSaturday,
} from "date-fns";
import { nl } from "date-fns/locale";
import MapView, { Marker } from "react-native-maps";
import { useRegistration } from "../queries/register";
import * as WebBrowser from "expo-web-browser";
import { decodeParam, param } from "../routes";

function friday() {
  return isFriday(new Date()) ? new Date() : nextFriday(new Date());
}

function saturday() {
  return isSaturday(new Date()) ? new Date() : nextSaturday(new Date());
}

function formatDateRange(startDate: Date, endDate: Date) {
  // Check if the dates are on the same day
  if (isSameDay(startDate, endDate)) {
    // Format the date range for the same day
    return `${format(startDate, "d MMMM yyyy HH:mm", { locale: nl })} – ${format(endDate, "HH:mm")}`;
  } else {
    // Format the date range for different days
    const formattedStartDate = format(startDate, "d MMMM yyyy HH:mm", {
      locale: nl,
    });
    const formattedEndDate = format(endDate, "d MMMM yyyy HH:mm", {
      locale: nl,
    });
    return `${formattedStartDate} – ${formattedEndDate}`;
  }
}

export default function EventScreen() {
  const params = useLocalSearchParams<{ event?: string; title?: string }>();
  const serialized = decodeParam<SerializedComponent>(params.event);

  if (!serialized)
    return (
      <Box className="flex-1 bg-background">
        <Stack.Screen options={{ title: param(params.title) }} />
        <Placeholder
          icon="calendar-remove"
          empty="Deze activiteit kon niet geladen worden"
        />
      </Box>
    );

  return (
    <EventDetails
      event={deserializeComponent<VEvent>(serialized)}
      title={param(params.title)}
    />
  );
}

function EventDetails({ event, title }: { event: VEvent; title: string }) {
  const router = useRouter();
  const { data, refetch } = useRegistration();

  function getDescription() {
    const html = event.getProperty("X-ALT-DESC")?.asString();
    if (html) {
      return convert(html, { wordwrap: false }).replace(/\\,/g, ",");
    }

    return event.description?.replace("Lees meer ...", "") || "";
  }

  function getDates() {
    const items: string[] = [];
    if (event.rrule) {
      const duration = event.duration
        ? parseInt(event.duration)
        : event.timeEnd!.getTime() - event.timeStart.getTime();
      let date: Date | null = new Date();
      date.setHours(0, 0, 0, 0);
      while (true) {
        date = event.rrule.after(date);
        if (!date) break;

        date.setHours(
          date.getHours() +
            (date.getTimezoneOffset() - event.timeStart.getTimezoneOffset()) /
              60,
        );

        const end = new Date(date.getTime() + duration);
        items.push(formatDateRange(date, end));
        if (items.length >= 5) break;
      }
    } else {
      items.push(formatDateRange(event.timeStart, event.timeEnd!));
    }

    return items.join("\n");
  }

  function allowsRegister() {
    const date = event.rrule?.after(new Date());
    if (!date || (!isSameDay(friday(), date) && !isSameDay(saturday(), date)))
      return false;

    return event
      .getProperty("CATEGORIES")
      ?.asString()
      .includes("Publiek (DJO open)");
  }

  async function register() {
    // `refetch` resolves with the error rather than throwing, so a failure just
    // leaves the list empty and falls through to the "not found" alert.
    const slots = data?.slots.length
      ? data.slots
      : ((await refetch()).data?.slots ?? []);

    const slot = slots.findIndex((slot) =>
      isSameDay(
        new Date(slot.date),
        event.rrule?.after(new Date()) || new Date(),
      ),
    );
    if (slot === -1) return Alert.alert("Dag niet gevonden");

    router.push({
      pathname: "/slot",
      params: { slot: slot, title: slots[slot].description },
    });
  }

  function isEvent() {
    const desc = event.getProperty("X-ALT-DESC")?.asString();
    if (!desc) return false;

    return desc.includes("events.djoamersfoort.nl");
  }

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen options={{ title }} />
      <ScrollView>
        <VStack className="gap-3 p-4 pb-8">
          {event.geo && (
            <Box className="aspect-square w-full overflow-hidden rounded-2xl">
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: parseFloat(event.geo.split(";")[0]),
                  longitude: parseFloat(event.geo.split(";")[1]),
                  latitudeDelta: 0.0051,
                  longitudeDelta: 0.0051,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(event.geo.split(";")[0]),
                    longitude: parseFloat(event.geo.split(";")[1]),
                  }}
                  title={event.location}
                />
              </MapView>
            </Box>
          )}

          <Heading size="xl" className="text-foreground">
            {event.summary || title}
          </Heading>

          {isEvent() && (
            <Button
              variant="secondary"
              onPress={() =>
                WebBrowser.openBrowserAsync("https://events.djoamersfoort.nl")
              }
              className="rounded-xl"
            >
              <ButtonText>Meld je aan</ButtonText>
            </Button>
          )}

          {allowsRegister() && (
            <Button onPress={register} className="rounded-xl">
              <ButtonText>
                Aanmelden voor aankomende{" "}
                {event.timeStart.toLocaleDateString("nl-NL", {
                  weekday: "long",
                })}
              </ButtonText>
            </Button>
          )}

          <VStack className="gap-2 rounded-2xl border border-border bg-card p-4">
            <HStack className="items-center gap-2">
              <Icon name="calendar" size={16} className="text-primary" />
              <Text
                size="xs"
                className="uppercase tracking-wide text-muted-foreground"
              >
                Wanneer
              </Text>
            </HStack>
            <Text className="text-foreground">{getDates()}</Text>
          </VStack>

          {!!getDescription() && (
            <VStack className="gap-2 rounded-2xl border border-border bg-card p-4">
              <HStack className="items-center gap-2">
                <Icon name="information" size={16} className="text-primary" />
                <Text
                  size="xs"
                  className="uppercase tracking-wide text-muted-foreground"
                >
                  Beschrijving
                </Text>
              </HStack>
              <Text className="leading-relaxed text-foreground">
                {getDescription()}
              </Text>
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
