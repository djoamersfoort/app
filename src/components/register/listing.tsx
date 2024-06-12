import { useContext, useEffect } from "react";
import AuthContext, { Authed } from "../../auth";
import { useAtom } from "jotai";
import { getSlots, membersAtom, Slot, slotsAtom } from "../../stores/register";
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
import logging from "../../logging";

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
  const authState = useContext(AuthContext);
  const [slots, setSlots] = useAtom(slotsAtom);
  const [_members, setMembers] = useAtom(membersAtom);

  useEffect(() => {
    async function fetchDays() {
      const token =
        authState.authenticated === Authed.AUTHENTICATED
          ? await authState.token
          : null;

      logging.log(
        "REGISTER",
        `Fetching initial register data with auth state ${authState.authenticated}, token is ${token ? "defined" : "undefined"}`,
      );
      const { slots, members } = await getSlots(token);

      setSlots(slots);
      setMembers(members || []);
    }

    fetchDays().then();
  }, [authState]);

  return (
    <Card>
      <Card.Title title={"Aanmelden"} />
      <Card.Content style={styles.content}>
        {slots ? (
          slots.map((slot, index) => (
            <SlotListing key={index} slot={slot} index={index} />
          ))
        ) : (
          <ActivityIndicator animating={true} />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
  },
});
