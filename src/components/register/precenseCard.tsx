import { useTheme } from "react-native-paper";
import { PaperSelect } from "react-native-paper-select";
import { Alert, StyleSheet, View } from "react-native";
import Presence from "./presence";
import { Member, Slot, useRegisterMember } from "../../queries/register";
import { errorMessage } from "../../api/errors";

export default function PresenceCard({
  slot,
  members,
}: {
  slot: Slot;
  members: Member[];
}) {
  const theme = useTheme();
  const registerMember = useRegisterMember();

  // `sort` mutates in place; copy first so the cached member list is untouched.
  const options = [...members]
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map(({ id, name }) => ({ _id: id.toString(), value: name }));

  if (!slot.presence) return null;

  return (
    <View>
      <PaperSelect
        label={"Lid handmatig aanmelden"}
        arrayList={options}
        selectedArrayList={[]}
        multiEnable={false}
        value={""}
        onSelection={async (selection) => {
          const selected = selection.selectedList[0];
          if (!selected) return;

          try {
            await registerMember.mutateAsync({ slot, member: selected._id });
          } catch (error) {
            Alert.alert("Aanmelden mislukt", errorMessage(error));
          }
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
          <Presence key={presence.id} presence={presence} />
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
