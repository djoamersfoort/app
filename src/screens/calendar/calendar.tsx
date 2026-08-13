import { ActivityIndicator, Appbar, Button, Text } from "react-native-paper";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { VEvent } from "unfucked-ical";
import Item from "../../components/feed/item";
import { ActionType, FeedItem, sortFeeds } from "../../queries/feed";
import Area from "../../components/area";
import { useEvents } from "../../queries/calendar";
import { errorMessage } from "../../api/errors";

export default function CalendarScreen() {
  const [date, setDate] = useState(new Date());
  const { data: events, isPending, error } = useEvents();

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
          description: occurrence.toLocaleDateString("nl-NL"),
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
    <>
      <Appbar.Header>
        <Appbar.Content title={"Agenda"} />
      </Appbar.Header>
      <ScrollView>
        <View style={styles.container}>
          <Area
            title={"Vanaf"}
            icon={"calendar"}
            right={
              <>
                {Platform.OS === "ios" && (
                  <DateTimePicker
                    value={date}
                    onChange={(_, date) => setDate(date as Date)}
                    mode={"date"}
                  />
                )}
                {Platform.OS === "android" && (
                  <Button
                    mode={"elevated"}
                    onPress={() => {
                      DateTimePickerAndroid.open({
                        value: date,
                        onChange: (_, date) => setDate(date as Date),
                        mode: "date",
                      });
                    }}
                  >
                    {date.toLocaleDateString("nl-NL")}
                  </Button>
                )}
              </>
            }
          />

          <Area title={"Bijzonderheden"} icon={"calendar-alert"}>
            {isPending ? (
              <ActivityIndicator animating={true} />
            ) : items.length > 0 ? (
              <>
                {items.map((item, index) => (
                  <Item item={item} key={index} />
                ))}
              </>
            ) : (
              <Text>
                {error
                  ? errorMessage(error)
                  : "Geen bijzonderheden vanaf deze datum"}
              </Text>
            )}
          </Area>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 10,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
