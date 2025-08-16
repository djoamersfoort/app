import { useTheme } from "react-native-paper";
import { PaperSelect } from "react-native-paper-select";
import { StyleSheet, View } from "react-native";
import Presence from "./presence";
import { Member, Slot } from "../../stores/register";
import AuthContext, { Authed } from "../../auth";
import { AANMELDEN } from "../../env";
import { useContext } from "react";

export default function PresenceCard({
  slot,
  members,
}: {
  slot: Slot;
  members: Member[];
}) {
  const theme = useTheme();
  const authState = useContext(AuthContext);

  async function registerManual(user: string) {
    if (authState.authenticated !== Authed.AUTHENTICATED) return;

    const token = await authState.token;
    await fetch(
      `${AANMELDEN}/api/v1/register_manual/${slot.name}/${slot.pod}/${user}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
  }

  if (!slot.presence) return;

  return (
    <View>
      <PaperSelect
        label={"Lid handmatig aanmelden"}
        arrayList={members
          .sort((a, b) => (a.name < b.name ? -1 : 1))
          .map(({ id, name }) => ({
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
          <Presence key={presence.id} presence={presence} slot={slot} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  presence: {
    gap: 5,
  },
});
