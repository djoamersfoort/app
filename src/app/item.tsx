import { Stack, useLocalSearchParams } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Badge, BadgeText } from "@/components/ui/badge";
import type { InventoryItem } from "@/queries/search";
import Icon from "@/components/icon";
import { Placeholder } from "@/components/screen";
import { decodeParam, param } from "@/routes";

export default function ItemScreen() {
  const params = useLocalSearchParams<{ item?: string; title?: string }>();
  // Inventory items are small, so the whole record travels as a JSON param.
  const item = decodeParam<InventoryItem>(params.item);
  const header = <Stack.Screen options={{ title: param(params.title) }} />;

  if (!item)
    return (
      <Box className="flex-1 bg-background">
        {header}
        <Placeholder
          icon="package-variant"
          empty="Dit item kon niet geladen worden"
        />
      </Box>
    );

  return (
    <Box className="flex-1 bg-background">
      {header}
      <VStack className="gap-4 p-4">
        <Box className="aspect-video w-full overflow-hidden rounded-2xl bg-secondary">
          <Image
            source={{
              uri: `https://inventory.djoamersfoort.nl/api/v1/location/${item.location_id}/photo`,
            }}
            alt={item.location}
            className="h-full w-full"
            resizeMode="cover"
          />
        </Box>

        <VStack className="gap-2">
          <Heading size="xl" className="text-foreground">
            {item.name}
          </Heading>
          {!!item.description && (
            <Text className="text-muted-foreground">{item.description}</Text>
          )}
        </VStack>

        <VStack className="gap-2 rounded-2xl border border-border bg-card p-4">
          <HStack className="items-center gap-2">
            <Icon name="map-marker" size={16} className="text-primary" />
            <Text
              size="xs"
              className="uppercase tracking-wide text-muted-foreground"
            >
              Locatie
            </Text>
          </HStack>
          <Text className="text-foreground">{item.location_description}</Text>
        </VStack>

        {item.properties?.length > 0 && (
          <HStack className="flex-wrap gap-2">
            {item.properties.map((property) => (
              <Badge
                key={property}
                variant="secondary"
                className="rounded-full"
              >
                <BadgeText className="normal-case">{property}</BadgeText>
              </Badge>
            ))}
          </HStack>
        )}
      </VStack>
    </Box>
  );
}
