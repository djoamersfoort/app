import { StackScreenProps } from "@react-navigation/stack";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Text } from "react-native-paper";
import { useContext, useEffect, useState } from "react";
import { membersAtom, Slot, slotsAtom } from "../../stores/register";
import { useAtom } from "jotai";
import { StackParamList } from "../../../App";
import AuthContext, { Authed } from "../../auth";
import { AANMELDEN } from "../../env";
import PresenceCard from "../../components/register/precenseCard";
import Area from "../../components/area";

type Props = StackScreenProps<StackParamList, "Slot">;

export default function SlotScreen({ route, navigation }: Props) {
  const [slots, setSlots] = useAtom(slotsAtom);
  if (!slots) return <></>;

  const [slot, setSlot] = useState<Slot>(slots[route.params.slot]);
  const [loading, setLoading] = useState(false);
  const [members] = useAtom(membersAtom);

  const authState = useContext(AuthContext);

  async function register() {
    setLoading(true);
    const token =
      authState.authenticated === Authed.AUTHENTICATED
        ? await authState.token
        : null;
    if (token) {
      const { error }: { error: string | undefined } = await fetch(
        `${AANMELDEN}/api/v1/${slot.is_registered ? "deregister" : "register"}/${slot.name}/${slot.pod}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      ).then((res) => res.json());

      if (error) {
        setLoading(false);
        return Alert.alert(error);
      }
    } else {
      if (slot.is_registered) {
        slot.available++;
        slot.taken--;
      } else {
        slot.available--;
        slot.taken++;
      }
      slot.is_registered = !slot.is_registered;
    }
  }

  useEffect(() => {
    setSlot(slots[route.params.slot]);
    setLoading(false);
  }, [slots]);

  if (!slot) return <Text>Something went wrong!</Text>;

  return (
    <View style={styles.slot}>
      <SafeAreaView style={styles.content}>
        <ScrollView>
          <View style={styles.info}>
            {authState.authenticated === Authed.AUTHENTICATED &&
              authState.user.stripcard && (
                <Area title={"Strippenkaart"} icon={"clipboard-list"}>
                  <Text variant={"titleSmall"}>
                    Je strippenkaart is {authState.user.stripcard.used} van de{" "}
                    {authState.user.stripcard.count} keer gebruikt.
                  </Text>
                </Area>
              )}
            {slot.announcement && (
              <>
                <Area title={"Aankondiging"} icon={"bullhorn"}>
                  <Text variant={"titleSmall"}>{slot.announcement}</Text>
                </Area>
              </>
            )}
            <Area title={"Datum"} icon={"calendar"}>
              <Text variant={"titleSmall"}>
                Je bent je aan het aanmelden voor{" "}
                {new Date(slot.date).toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
            </Area>
            <Area title={"Beschikbaarheid"} icon={"account"}>
              <Text variant={"titleSmall"}>
                Er zijn {slot.available}/{slot.available + slot.taken} plekken
                beschikbaar.
              </Text>
            </Area>

            <Area title={"Begeleiders"} icon={"account-supervisor"}>
              <View style={styles.chips}>
                {slot.tutors.length === 0 && (
                  <Text>Er zijn nog geen begeleiders aangemeld</Text>
                )}
                {slot.tutors.map((tutor) => (
                  <Chip key={tutor}>{tutor}</Chip>
                ))}
              </View>
            </Area>

            {slot.presence && (
              <>
                <Area title={"Leden"} icon={"account-details"}>
                  <PresenceCard slot={slot} members={members} />
                </Area>
              </>
            )}
          </View>
        </ScrollView>
        <View>
          <Button
            style={styles.button}
            labelStyle={{ fontSize: 17 }}
            disabled={
              loading ||
              (!slot.is_registered &&
                slot.available === 0 &&
                !(
                  authState.authenticated === Authed.AUTHENTICATED &&
                  authState.user.account_type.includes("begeleider")
                ))
            }
            loading={loading}
            contentStyle={{ height: 50 }}
            mode={slot.is_registered ? "outlined" : "contained"}
            onPress={register}
          >
            {slot.is_registered ? "Afmelden" : "Aanmelden"}
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    padding: 10,
    paddingTop: 0,
  },
  content: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  info: {
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  button: {
    borderRadius: 25,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
