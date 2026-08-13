import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Button, Chip, Text } from "react-native-paper";
import { Stack, useLocalSearchParams } from "expo-router";
import { useRegistration, useToggleRegistration } from "../queries/register";
import { Authed, useAuth } from "../auth";
import PresenceCard from "../components/register/precenseCard";
import Area from "../components/area";
import { errorMessage } from "../api/errors";
import { numberParam, param } from "../routes";

export default function SlotScreen() {
  const params = useLocalSearchParams<{ slot?: string; title?: string }>();
  const title = param(params.title);
  const index = numberParam(params.slot, -1);

  // Hooks run unconditionally: the previous version returned early when the
  // slots had not loaded yet, which changed the hook order between renders.
  const { data, isPending } = useRegistration();
  const toggleRegistration = useToggleRegistration();
  const authState = useAuth();

  const slot = index >= 0 ? data?.slots[index] : undefined;
  const members = data?.members ?? [];

  async function register() {
    if (!slot) return;

    try {
      await toggleRegistration.mutateAsync(slot);
    } catch (error) {
      Alert.alert(errorMessage(error));
    }
  }

  // The header title comes from the route params, so it is declared in every
  // branch rather than only in the loaded one.
  const header = <Stack.Screen options={{ title }} />;

  if (isPending)
    return (
      <>
        {header}
        <ActivityIndicator animating={true} />
      </>
    );
  if (!slot)
    return (
      <>
        {header}
        <Text>Something went wrong!</Text>
      </>
    );

  const isTutor =
    authState.authenticated === Authed.AUTHENTICATED &&
    authState.user.account_type.includes("begeleider");

  return (
    <View style={styles.slot}>
      {header}
      <SafeAreaView style={styles.content} edges={["right", "bottom", "left"]}>
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
              <Area title={"Aankondiging"} icon={"bullhorn"}>
                <Text variant={"titleSmall"}>{slot.announcement}</Text>
              </Area>
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
              <Area title={"Leden"} icon={"account-details"}>
                <PresenceCard slot={slot} members={members} />
              </Area>
            )}
          </View>
        </ScrollView>
        <View>
          <Button
            style={styles.button}
            labelStyle={{ fontSize: 17 }}
            disabled={
              toggleRegistration.isPending ||
              (!slot.is_registered && slot.available === 0 && !isTutor)
            }
            loading={toggleRegistration.isPending}
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
