import { StackScreenProps } from "@react-navigation/stack";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Chip,
  Text,
  useTheme,
} from "react-native-paper";
import { useContext, useEffect, useState } from "react";
import { getSlots, membersAtom, Slot, slotsAtom } from "../../stores/register";
import { useAtom } from "jotai";
import { StackParamList } from "../../../App";
import AuthContext, { Authed } from "../../auth";
import Presence from "../../components/register/presence";
import { PaperSelect } from "react-native-paper-select";

type Props = StackScreenProps<StackParamList, "Slot">;

export default function SlotScreen({ route, navigation }: Props) {
  const [slots, setSlots] = useAtom(slotsAtom);
  if (!slots) return <></>;

  const [slot, setSlot] = useState<Slot>(slots[route.params.slot]);
  const [loading, setLoading] = useState(false);
  const [members] = useAtom(membersAtom);
  const theme = useTheme();

  const authState = useContext(AuthContext);

  async function registerManual(user: string) {
    if (authState.authenticated !== Authed.AUTHENTICATED) return;

    const token = await authState.token;
    await fetch(
      `https://aanmelden.djoamersfoort.nl/api/v1/register_manual/${slot.name}/${slot.pod}/${user}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    setSlots((await getSlots(token)).slots);
  }

  async function register() {
    setLoading(true);
    const token =
      authState.authenticated === Authed.AUTHENTICATED
        ? await authState.token
        : null;
    if (token) {
      const { error }: { error: string | undefined } = await fetch(
        `https://aanmelden.djoamersfoort.nl/api/v1/${slot.is_registered ? "deregister" : "register"}/${slot.name}/${slot.pod}`,
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

    setSlots((await getSlots(token)).slots);
    setLoading(false);
  }

  useEffect(() => {
    setSlot(slots[route.params.slot]);
  }, [slots]);

  if (!slot) return <Text>Something went wrong!</Text>;

  return (
    <View style={styles.slot}>
      <ScrollView>
        <View style={styles.info}>
          {slot.announcement && (
            <>
              <Text variant={"titleMedium"}>Aankondiging</Text>
              <Card>
                <Card.Content>
                  <Text variant={"titleSmall"}>{slot.announcement}</Text>
                </Card.Content>
              </Card>
            </>
          )}
          <Text variant={"titleMedium"}>Beschikbaarheid</Text>
          <Card>
            <Card.Content>
              <Text variant={"titleSmall"}>
                Er zijn {slot.available}/{slot.available + slot.taken} plekken
                beschikbaar.
              </Text>
            </Card.Content>
          </Card>

          <Text variant={"titleMedium"}>Begeleiders</Text>
          <Card>
            <Card.Content style={styles.chips}>
              {slot.tutors.length === 0 && (
                <Text>Er zijn nog geen begeleiders aangemeld</Text>
              )}
              {slot.tutors.map((tutor) => (
                <Chip key={tutor}>{tutor}</Chip>
              ))}
            </Card.Content>
          </Card>

          {slot.presence && (
            <>
              <Text variant={"titleMedium"}>Leden</Text>
              <Card>
                <Card.Content>
                  <PaperSelect
                    label={"Lid handmatig aanmelden"}
                    arrayList={members.sort((a, b) => a.name < b.name ? -1 : 1) .map(({ id, name }) => ({
                      _id: id.toString(),
                      value: name,
                    }))}
                    selectedArrayList={[]}
                    multiEnable={false}
                    value={""}
                    onSelection={async (selection) => {
                      if (!selection.selectedList[0]) return;
                      await registerManual(selection.selectedList[0]._id);
                    }}
                    theme={theme}
                    textInputStyle={{
                      backgroundColor: theme.colors.elevation.level5,
                      color: theme.colors.onPrimaryContainer,
                    }}
                    searchStyle={{
                      backgroundColor: theme.colors.elevation.level5,
                    }}
                    textColor={theme.colors.onPrimary}
                  />
                  <View style={styles.presence}>
                    {slot.presence.map((presence) => (
                      <Presence
                        key={presence.id}
                        presence={presence}
                        slot={slot}
                      />
                    ))}
                  </View>
                </Card.Content>
              </Card>
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
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 10,
    paddingTop: 0,
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
  presence: {
    gap: 5,
  },
});
