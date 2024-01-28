import { Avatar, Card, IconButton } from "react-native-paper";
import { TouchableOpacity, View } from "react-native";

export default function SlotListing({ slot, slotId, user, navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Slot", { slot, slotId, user })}
    >
      <View>
        <Card mode={"contained"}>
          <Card.Title
            title={slot.description}
            subtitle={`Er zijn ${slot.available} plaatsen beschikbaar`}
            left={(props) => <Avatar.Icon {...props} icon={"calendar-edit"} />}
            right={(props) => <IconButton {...props} icon={"chevron-right"} />}
          />
        </Card>
      </View>
    </TouchableOpacity>
  );
}
