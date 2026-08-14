import { useState } from "react";
import { ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { CorveeAction, CorveeProfile, useCorveeAction } from "@/queries/corvee";

export default function ProfileCard({ selected }: { selected: CorveeProfile }) {
  // Which button is spinning; the mutation itself only knows that one is.
  const [pending, setPending] = useState<CorveeAction | null>(null);
  const corveeAction = useCorveeAction();

  function run(action: CorveeAction) {
    return () => {
      setPending(action);
      corveeAction.mutate(
        { id: selected.id, action },
        { onSettled: () => setPending(null) },
      );
    };
  }

  return (
    <VStack className="overflow-hidden rounded-3xl border border-border bg-card">
      <Image
        source={{ uri: selected.picture }}
        alt={`${selected.first_name} ${selected.last_name}`}
        className="aspect-square w-full"
        resizeMode="cover"
      />

      <VStack className="gap-3 p-4">
        <Heading size="md" className="text-foreground">
          {selected.first_name} {selected.last_name}
        </Heading>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack className="gap-2">
            <Button
              onPress={run(CorveeAction.ACKNOWLEDGE)}
              isDisabled={!!pending}
              className="rounded-full"
            >
              {pending === CorveeAction.ACKNOWLEDGE && <ButtonSpinner />}
              <ButtonText>Aftekenen</ButtonText>
            </Button>
            <Button
              variant="secondary"
              onPress={run(CorveeAction.ABSENT)}
              isDisabled={!!pending}
              className="rounded-full"
            >
              {pending === CorveeAction.ABSENT && <ButtonSpinner />}
              <ButtonText>Afwezig</ButtonText>
            </Button>
            <Button
              variant="secondary"
              onPress={run(CorveeAction.INSUFFICIENT)}
              isDisabled={!!pending}
              className="rounded-full"
            >
              {pending === CorveeAction.INSUFFICIENT && <ButtonSpinner />}
              <ButtonText>Onvoldoende</ButtonText>
            </Button>
          </HStack>
        </ScrollView>
      </VStack>
      <Box />
    </VStack>
  );
}
