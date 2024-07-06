import { useAtomValue } from "jotai";
import { Slot, slotsAtom } from "../../stores/register";
import {
  ActivityIndicator,
  Avatar,
  Card,
  IconButton,
} from "react-native-paper";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { StackParamList } from "../../../App";
import Area from "../area";

type SlotNavigationProps = NativeStackNavigationProp<StackParamList>;

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

  return (
    <Area title={"Aanmelden"} icon={"playlist-check"}>
      {slots ? (
        slots.map((slot, index) => (
          <SlotListing key={index} slot={slot} index={index} />
        ))
      ) : (
        <ActivityIndicator animating={true} />
      )}
    </Area>
  );
}
