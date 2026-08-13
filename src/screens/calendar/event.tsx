import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { deserializeComponent, VEvent } from "unfucked-ical";
import { Button, Text } from "react-native-paper";
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
import { useRegistration } from "../../queries/register";
import * as WebBrowser from "expo-web-browser";
import Area from "../../components/area";
import { errorMessage } from "../../api/errors";

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

type Props = StackScreenProps<StackParamList, "Event">;

export default function EventScreen({ route, navigation }: Props) {
  const { data, refetch } = useRegistration();
  const event = deserializeComponent<VEvent>(route.params.event);

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
    let slots = data?.slots ?? [];

    if (slots.length === 0) {
      try {
        slots = (await refetch()).data?.slots ?? [];
      } catch (error) {
        return Alert.alert("Aanmelden mislukt", errorMessage(error));
      }
    }

    const slot = slots.findIndex((slot) =>
      isSameDay(
        new Date(slot.date),
        event.rrule?.after(new Date()) || new Date(),
      ),
    );
    if (slot === -1) return Alert.alert("Dag niet gevonden");

    navigation.push("Slot", {
      title: slots[slot].description,
      slot: slot,
    });
  }

  function isEvent() {
    const desc = event.getProperty("X-ALT-DESC")?.asString();
    if (!desc) return false;

    return desc.includes("events.djoamersfoort.nl");
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {event.geo && (
          <MapView
            style={styles.map}
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
        )}
        {isEvent() && (
          <Button
            mode={"contained"}
            onPress={() =>
              WebBrowser.openBrowserAsync("https://events.djoamersfoort.nl")
            }
          >
            Meld je aan
          </Button>
        )}
        {allowsRegister() && (
          <Button onPress={register} mode={"contained"}>
            Aanmelden voor aankomende{" "}
            {event.timeStart.toLocaleDateString("nl-NL", { weekday: "long" })}
          </Button>
        )}
        {getDescription() && (
          <Area title={"Beschrijving"} icon={"information"}>
            <Text>{getDescription()}</Text>
          </Area>
        )}
        <Area title={"Wanneer"} icon={"calendar"}>
          <Text>{getDates()}</Text>
        </Area>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 10,
  },
  map: {
    aspectRatio: 1,
    borderRadius: 10,
  },
});
