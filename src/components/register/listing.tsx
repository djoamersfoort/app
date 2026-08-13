import { Slot, useRegistration } from "../../queries/register";
import {
  ActivityIndicator,
  Avatar,
  Card,
  Chip,
  Icon,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Area from "../area";
import { registerTranslation } from "react-native-paper-dates";
import { useState } from "react";
import nl from "react-native-paper-dates/src/translations/nl";
import Calendar from "./calendar";
import { Authed, useAuth } from "../../auth";
import { errorMessage } from "../../api/errors";

registerTranslation("nl", nl);

function SlotListing({ slot, index }: { slot: Slot; index: number }) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/slot",
          params: { slot: index, title: slot.description },
        })
      }
    >
      <Card mode={"contained"}>
        <Card.Title
          title={slot.description}
          subtitle={
            <View style={styles.chips}>
              <Chip
                style={{
                  backgroundColor: theme.colors.backdrop,
                }}
                icon={"account-multiple"}
              >
                {slot.available}/{slot.available + slot.taken} &nbsp;
                <Icon
                  color={theme.colors.primary}
                  size={16}
                  source={slot.is_registered ? "check" : "close"}
                />
                {slot.is_registered ? "Aangemeld" : "Afwezig"}
              </Chip>
            </View>
          }
          left={(props) => <Avatar.Icon {...props} icon={"calendar-edit"} />}
          right={(props) => <IconButton {...props} icon={"chevron-right"} />}
        />
      </Card>
    </TouchableOpacity>
  );
}

export default function Listing() {
  const { data, isPending, error } = useRegistration();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const authState = useAuth();

  return (
    <>
      <Area
        title={"Aanmelden"}
        icon={"playlist-check"}
        right={
          (authState.authenticated === Authed.AUTHENTICATED &&
            authState.user.account_type.includes("begeleider") && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setCalendarOpen(true)}
              >
                <Icon size={22} source={"calendar"} />
              </TouchableOpacity>
            )) || <></>
        }
      >
        {isPending ? (
          <ActivityIndicator animating={true} />
        ) : data && data.slots.length > 0 ? (
          <>
            {data.slots.map((slot, index) => (
              <SlotListing key={index} slot={slot} index={index} />
            ))}
          </>
        ) : (
          <Text>
            {error ? errorMessage(error) : "Er zijn geen dagen beschikbaar"}
          </Text>
        )}
      </Area>
      <Calendar open={calendarOpen} setOpen={setCalendarOpen} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 20,
    position: "absolute",
    right: -20,
    top: -20,
  },
  chips: {
    flexDirection: "row",
  },
});
