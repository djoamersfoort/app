import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import PresenceCard from "../register/presence-card";
import { useRegistration } from "@/queries/register";
import { CorveeState, useCreateCorvee } from "@/queries/corvee";
import { Placeholder } from "../screen";

export default function CreateList({ state }: { state: CorveeState }) {
  const { data, isPending } = useRegistration();
  const createCorvee = useCreateCorvee();

  const slot = data?.slots.find(
    (slot) => slot.pod === state.pod && slot.name === state.day,
  );

  if (!slot)
    return (
      <Placeholder
        isPending={isPending}
        icon="calendar-remove"
        empty="Geen dag gevonden om corvee voor aan te maken"
        className="rounded-2xl border border-border bg-card"
      />
    );

  return (
    <VStack className="gap-4">
      <VStack className="gap-4 rounded-2xl border border-border bg-card p-4">
        <VStack>
          <Heading size="sm" className="text-foreground">
            Wie is er aanwezig?
          </Heading>
          <Text size="xs" className="text-muted-foreground">
            Vink af wie er is, dan maken we de lijst aan.
          </Text>
        </VStack>

        <PresenceCard slot={slot} members={data?.members ?? []} />
      </VStack>

      <Button
        onPress={() => createCorvee.mutate()}
        isDisabled={createCorvee.isPending}
        className="rounded-xl"
      >
        {createCorvee.isPending && <ButtonSpinner />}
        <ButtonText>Maak lijst aan</ButtonText>
      </Button>
    </VStack>
  );
}
