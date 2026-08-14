import { useState } from "react";
import { useRouter } from "expo-router";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import { Slot, useRegistration } from "@/queries/register";
import { Authed, useAuth } from "@/auth";
import Section from "../section";
import Icon from "../icon";
import { IconButton, Placeholder } from "../screen";
import DatePicker from "./date-picker";

function weekday(date: string) {
  return new Date(date).toLocaleDateString("nl-NL", { weekday: "long" });
}

function SlotCard({ slot, index }: { slot: Slot; index: number }) {
  const router = useRouter();
  const total = slot.available + slot.taken;
  const full = slot.available === 0;

  return (
    <Pressable
      className="flex-1 active:opacity-70"
      onPress={() =>
        router.push({
          pathname: "/slot",
          params: { slot: index, title: slot.description },
        })
      }
    >
      <VStack className="gap-3 rounded-2xl border border-border bg-card p-4">
        <HStack className="items-center gap-2">
          <Box className="h-9 w-9 items-center justify-center rounded-full bg-accent">
            <Icon
              name="calendar-edit"
              size={18}
              className="text-accent-foreground"
            />
          </Box>
          <Icon
            name="chevron-right"
            size={20}
            className="ml-auto text-muted-foreground"
          />
        </HStack>

        <Heading size="sm" className="capitalize text-foreground">
          {slot.description}
        </Heading>

        {/* Two separate chips: attendance first, then availability. */}
        <VStack className="items-start gap-1.5">
          <Badge
            variant={slot.is_registered ? "default" : "outline"}
            className="rounded-full"
          >
            <Icon
              name={slot.is_registered ? "check-circle" : "close-circle"}
              size={13}
              className={
                slot.is_registered
                  ? "mr-1 text-primary-foreground"
                  : "mr-1 text-muted-foreground"
              }
            />
            <BadgeText className="normal-case">
              {slot.is_registered ? "Aanwezig" : "Afwezig"}
            </BadgeText>
          </Badge>

          <Badge
            variant={full ? "destructive" : "secondary"}
            className="rounded-full"
          >
            <Icon
              name={"account-group"}
              size={13}
              className={"mr-1 text-muted-foreground"}
            />
            <BadgeText className="normal-case">
              {full ? "Vol" : `${slot.available}/${total} vrij`}
            </BadgeText>
          </Badge>
        </VStack>
      </VStack>
    </Pressable>
  );
}

/**
 * The register section: each upcoming day as its own card, laid out side by
 * side rather than stacked.
 */
export default function SlotCards() {
  const { data, isPending, error } = useRegistration();
  const [pickerOpen, setPickerOpen] = useState(false);
  const auth = useAuth();

  const tutor =
    auth.authenticated === Authed.AUTHENTICATED &&
    auth.user.account_type.includes("begeleider");

  const slots = data?.slots ?? [];

  return (
    <>
      <Section
        title="Aanmelden"
        icon="playlist-check"
        action={
          tutor ? (
            <IconButton
              icon="calendar"
              label="Kies dagen"
              onPress={() => setPickerOpen(true)}
            />
          ) : undefined
        }
      >
        {isPending || slots.length === 0 ? (
          <Box className="px-4">
            <Placeholder
              isPending={isPending}
              error={error}
              icon="calendar-remove"
              empty="Er zijn geen dagen beschikbaar"
              className="rounded-2xl border border-border bg-card"
            />
          </Box>
        ) : (
          <HStack className="gap-3 px-4">
            {slots.map((slot, index) => (
              <SlotCard
                key={`${slot.name}-${slot.pod}`}
                slot={slot}
                index={index}
              />
            ))}
          </HStack>
        )}
      </Section>

      <DatePicker open={pickerOpen} setOpen={setPickerOpen} />
    </>
  );
}
