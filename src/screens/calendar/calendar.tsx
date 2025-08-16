import { Appbar, Button } from "react-native-paper";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { parse, VEvent } from "unfucked-ical";
import Item from "../../components/feed/item";
import { ActionType, FeedItem, sortFeeds } from "../../stores/feed";
import Area from "../../components/area";

export default function CalendarScreen() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<VEvent[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    async function getEvents() {
      const res = await fetch("https://www.djoamersfoort.nl/feed/eo-events/");
      const data = await res.text();

      setEvents(parse(data).events);
    }

    getEvents().then();
  }, []);

  useEffect(() => {
    function nextDate(event: VEvent) {
      if (event.rrule) {
        const next = event.rrule.after(
          date > event.timeStart ? date : event.timeStart,
        );
        if (next) return next;
      }

      return event.timeStart;
    }

    date.setHours(0, 0, 0, 0);
    const items = events
      .map((event) => {
        const date = nextDate(event);

        return {
          icon: event.rrule ? "calendar" : "calendar-alert",
          title: event.summary || "unknown",
          description: date.toLocaleDateString("nl-NL"),
          date: date.getTime(),
          action: {
            type: ActionType.EVENT,
            event: event.serialize(),
          },
        } satisfies FeedItem;
      })
      .filter((item) => item.date > date.getTime());

    setItems(sortFeeds(items).reverse());
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
            {items.map((item, index) => (
              <Item item={item} key={index} />
            ))}
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
