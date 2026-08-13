import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { Stack, useLocalSearchParams } from "expo-router";
import type { InventoryItem } from "../queries/search";
import { decodeParam, param } from "../routes";

export default function ItemScreen() {
  const params = useLocalSearchParams<{ item?: string; title?: string }>();
  // Inventory items are small, so the whole record travels as a JSON param.
  const item = decodeParam<InventoryItem>(params.item);

  if (!item)
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: param(params.title) }} />
        <Text>Dit item kon niet geladen worden</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: param(params.title) }} />
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
