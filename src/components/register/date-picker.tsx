import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { nl } from "date-fns/locale";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { useRegistration, useUpdateFutureDates } from "@/queries/register";
import Icon from "../icon";

const KEY = "yyyy-MM-dd";
/** Monday-first, matching the Dutch calendar convention. */
const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** Monday = 0 … Sunday = 6, from JavaScript's Sunday-first `getDay`. */
function weekIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

/**
 * Multi-date picker for the days a tutor signs up for.
 *
 * Replaces react-native-paper-dates, which was the last piece of Material UI in
 * the app and looked nothing like the rest of it.
 */
export default function DatePicker({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { data } = useRegistration();
  const updateDates = useUpdateFutureDates();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const initial = useMemo(
    () => new Set((data?.dates ?? []).map((date) => format(date, KEY))),
    [data?.dates],
  );

  // Reset to whatever the server currently has each time the sheet opens.
  useEffect(() => {
    if (open) {
      setSelected(new Set(initial));
      setMonth(startOfMonth(new Date()));
    }
  }, [open, initial]);

  // Only weekdays that actually have a slot can be picked.
  const openWeekdays = useMemo(
    () =>
      new Set(
        (data?.slots ?? []).map((slot) => weekIndex(new Date(slot.date))),
      ),
    [data?.slots],
  );

  const today = startOfDay(new Date());
  const days = useMemo(
    () =>
      eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month],
  );

  function toggle(date: Date) {
    const key = format(date, KEY);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function save() {
    const add = [...selected].filter((date) => !initial.has(date));
    const remove = [...initial].filter((date) => !selected.has(date));

    setOpen(false);
    if (add.length === 0 && remove.length === 0) return;

    updateDates.mutate({ add, remove });
  }

  return (
    <Actionsheet isOpen={open} onClose={() => setOpen(false)}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <VStack className="w-full gap-4 p-4">
          <VStack className="gap-1">
            <Heading size="md" className="text-foreground">
              Voor welke dagen wil je je aanmelden?
            </Heading>
            <Text size="xs" className="text-muted-foreground">
              Tik op een dag om je aan- of af te melden.
            </Text>
          </VStack>

          <HStack className="items-center justify-between">
            <Pressable
              onPress={() => setMonth(addMonths(month, -1))}
              hitSlop={8}
              accessibilityLabel="Vorige maand"
              className="h-10 w-10 items-center justify-center active:opacity-50"
            >
              <Icon name="chevron-left" size={24} className="text-foreground" />
            </Pressable>

            <Text className="font-semibold capitalize text-foreground">
              {format(month, "LLLL yyyy", { locale: nl })}
            </Text>

            <Pressable
              onPress={() => setMonth(addMonths(month, 1))}
              hitSlop={8}
              accessibilityLabel="Volgende maand"
              className="h-10 w-10 items-center justify-center active:opacity-50"
            >
              <Icon
                name="chevron-right"
                size={24}
                className="text-foreground"
              />
            </Pressable>
          </HStack>

          <HStack>
            {WEEKDAYS.map((day) => (
              <Box key={day} className="w-[14.28%] items-center">
                <Text size="xs" className="uppercase text-muted-foreground">
                  {day}
                </Text>
              </Box>
            ))}
          </HStack>

          <HStack className="flex-wrap">
            {/* Blank cells so the first day lands under its weekday. */}
            {Array.from({ length: weekIndex(days[0]) }).map((_, index) => (
              <Box key={`pad-${index}`} className="h-11 w-[14.28%]" />
            ))}

            {days.map((day) => {
              const key = format(day, KEY);
              const isSelected = selected.has(key);
              const disabled =
                isBefore(day, today) || !openWeekdays.has(weekIndex(day));

              return (
                <Box key={key} className="h-11 w-[14.28%] p-0.5">
                  <Pressable
                    disabled={disabled}
                    onPress={() => toggle(day)}
                    className={`flex-1 items-center justify-center rounded-full active:opacity-60 ${
                      isSelected ? "bg-primary" : ""
                    }`}
                  >
                    <Text
                      size="sm"
                      className={
                        disabled
                          ? "text-muted-foreground/40"
                          : isSelected
                            ? "font-semibold text-primary-foreground"
                            : "text-foreground"
                      }
                    >
                      {format(day, "d")}
                    </Text>
                  </Pressable>
                </Box>
              );
            })}
          </HStack>

          <HStack className="gap-3 pt-1">
            <Button
              variant="outline"
              onPress={() => setOpen(false)}
              className="flex-1 rounded-xl"
            >
              <ButtonText>Annuleer</ButtonText>
            </Button>
            <Button
              onPress={save}
              isDisabled={updateDates.isPending}
              className="flex-1 rounded-xl"
            >
              {updateDates.isPending && <ButtonSpinner />}
              <ButtonText>Aanpassen</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}
