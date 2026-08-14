import { useMemo, useState } from "react";
import { Platform, ScrollView } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { VEvent } from "unfucked-ical";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { ActionType, FeedItem, sortFeeds } from "@/queries/feed";
import { useEvents } from "@/queries/calendar";
import Item from "@/components/feed/item";
import Section from "@/components/section";
import Icon from "@/components/icon";
import { Placeholder, ScreenHeader, useTabBarInset } from "@/components/screen";

export default function CalendarScreen() {
  const [date, setDate] = useState(new Date());
  const { data: events, isPending, error } = useEvents();
  const tabBarInset = useTabBarInset();

  const items = useMemo(() => {
    // Normalise into a copy: mutating the state Date in place left the picker
    // and the filter disagreeing about which day was selected.
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);

    function nextDate(event: VEvent) {
      if (event.rrule) {
        const next = event.rrule.after(
          from > event.timeStart ? from : event.timeStart,
        );
        if (next) return next;
      }

      return event.timeStart;
    }

    const entries = (events ?? [])
      .map((event) => {
        const occurrence = nextDate(event);

        return {
          icon: event.rrule ? "calendar" : "calendar-alert",
          title: event.summary || "unknown",
          description: occurrence.toLocaleDateString("nl-NL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
          date: occurrence.getTime(),
          action: {
            type: ActionType.EVENT,
            event: event.serialize(),
          },
        } satisfies FeedItem;
      })
      .filter((item) => item.date > from.getTime());

    return sortFeeds(entries).reverse();
  }, [date, events]);

  return (
    <Box className="flex-1 bg-background">
      <ScreenHeader title="Agenda" subtitle="Wat er binnenkort gebeurt" />

      <ScrollView contentContainerStyle={{ paddingBottom: tabBarInset }}>
        <VStack className="gap-9 pt-6">
          <Section title="Vanaf" icon="calendar">
            <Box className="px-4">
              <HStack className="items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                <HStack className="items-center gap-2">
                  <Icon
                    name="calendar-start"
                    size={18}
                    className="text-muted-foreground"
                  />
                  <Text className="text-foreground">Toon vanaf</Text>
                </HStack>

                {Platform.OS === "ios" ? (
                  <DateTimePicker
                    value={date}
                    onChange={(_, next) => setDate(next as Date)}
                    mode={"date"}
                    locale="nl-NL"
                  />
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() =>
                      DateTimePickerAndroid.open({
                        value: date,
                        onChange: (_, next) => setDate(next as Date),
                        mode: "date",
                      })
                    }
                  >
                    <ButtonText>{date.toLocaleDateString("nl-NL")}</ButtonText>
                  </Button>
                )}
              </HStack>
            </Box>
          </Section>

          <Section title="Bijzonderheden" icon="calendar-alert">
            <Box className="px-4">
              {isPending || items.length === 0 ? (
                <Placeholder
                  isPending={isPending}
                  error={error}
                  icon="calendar-blank-outline"
                  empty="Geen bijzonderheden vanaf deze datum"
                  className="rounded-2xl border border-border bg-card"
                />
              ) : (
                <VStack className="gap-3">
                  {items.map((item, index) => (
                    <Item item={item} key={index} />
                  ))}
                </VStack>
              )}
            </Box>
          </Section>
        </VStack>
      </ScrollView>
    </Box>
  );
}
