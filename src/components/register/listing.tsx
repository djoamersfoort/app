import { useAtomValue } from "jotai";
import { Slot, slotsAtom } from "../../stores/register";
import {
  ActivityIndicator,
  Avatar,
  Card,
  Chip,
  Icon,
  IconButton,
  MD3Colors,
  useTheme,
} from "react-native-paper";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { StackParamList } from "../../../App";
import Area from "../area";
import { registerTranslation } from "react-native-paper-dates";
import { useContext, useState } from "react";
import nl from "react-native-paper-dates/src/translations/nl";
import Calendar from "./calendar";
import AuthContext, { Authed } from "../../auth";

type SlotNavigationProps = NavigationProp<StackParamList>;

registerTranslation("nl", nl);

function SlotListing({ slot, index }: { slot: Slot; index: number }) {
  const navigation = useNavigation<SlotNavigationProps>();
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("Slot", { slot: index, title: slot.description })
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
  const slots = useAtomValue(slotsAtom);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const authState = useContext(AuthContext);

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
        {slots ? (
          slots.map((slot, index) => (
            <SlotListing key={index} slot={slot} index={index} />
          ))
        ) : (
          <ActivityIndicator animating={true} />
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
