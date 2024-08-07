import {useAtomValue} from "jotai";
import {Slot, slotsAtom} from "../../stores/register";
import {ActivityIndicator, Avatar, Card, Icon, IconButton,} from "react-native-paper";
import {StyleSheet, TouchableOpacity} from "react-native";
import {useNavigation} from "@react-navigation/native";
import {NativeStackNavigationProp} from "react-native-screens/native-stack";
import {StackParamList} from "../../../App";
import Area from "../area";
import {registerTranslation} from "react-native-paper-dates";
import {useState} from "react";
import nl from "react-native-paper-dates/src/translations/nl";
import Calendar from "./calendar";

type SlotNavigationProps = NativeStackNavigationProp<StackParamList>;

registerTranslation('nl', nl)

function SlotListing({ slot, index }: { slot: Slot; index: number }) {
  const navigation = useNavigation<SlotNavigationProps>();

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("Slot", { slot: index, title: slot.description })
      }
    >
      <Card mode={"contained"}>
        <Card.Title
          title={slot.description}
          subtitle={`Er zijn ${slot.available} plaatsen beschikbaar`}
          left={(props) => <Avatar.Icon {...props} icon={"calendar-edit"} />}
          right={(props) => <IconButton {...props} icon={"chevron-right"} />}
        />
      </Card>
    </TouchableOpacity>
  );
}

export default function Listing() {
  const slots = useAtomValue(slotsAtom);
  const [calendarOpen, setCalendarOpen] = useState(false)

  return (
    <>
      <Area title={"Aanmelden"} icon={"playlist-check"} right={(
          <TouchableOpacity style={styles.button} onPress={() => setCalendarOpen(true)}>
              <Icon size={22} source={"calendar"} />
          </TouchableOpacity>
      )}>
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
  }
})
