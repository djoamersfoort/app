import { StyleSheet, View } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../../App";
import { Card, Text } from "react-native-paper";

type Props = StackScreenProps<StackParamList, "Item">;

export default function ItemScreen({ route }: Props) {
  const { item } = route.params;

  return (
    <View style={styles.container}>
      <Card>
        <Card.Cover
          source={{
            uri: `https://inventory.djoamersfoort.nl/api/v1/location/${item.location_id}/photo`,
          }}
        />
        <Card.Title title={item.name} subtitle={item.description} />
        <Card.Content>
          <Text>{item.location_description}</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});
