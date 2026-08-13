import { useMemo } from "react";
import { Alert } from "react-native";
import {
  MultiChange,
  MultiConfirm,
} from "react-native-paper-dates/lib/typescript/Date/Calendar";
import { format, subDays } from "date-fns";
import { DatePickerModal } from "react-native-paper-dates";
import { useRegistration, useUpdateFutureDates } from "../../queries/register";
import { errorMessage } from "../../api/errors";
import logging from "../../logging";

export default function Calendar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { data } = useRegistration();
  const updateDates = useUpdateFutureDates();

  const addedDates = useMemo(() => new Set<string>(), []);
  const removedDates = useMemo(() => new Set<string>(), []);
  const disabledWeekdays = useMemo(
    () =>
      [6, 0, 1, 2, 3, 4, 5].filter(
        (_, day) =>
          !data?.slots.find((slot) => new Date(slot.date).getDay() === day),
      ),
    [data?.slots],
  );

  const onChange: MultiChange = ({ datePressed, change }) => {
    logging.log("CALENDAR", `Date ${datePressed} changed to ${change}`);
    const date = format(datePressed, "yyyy-MM-dd");
    if (change === "added") {
      if (removedDates.has(date)) removedDates.delete(date);
      else addedDates.add(date);
    } else {
      if (addedDates.has(date)) addedDates.delete(date);
      else removedDates.add(date);
    }
  };

  const saveDates: MultiConfirm = async () => {
    setOpen(false);

    const add = Array.from(addedDates.values());
    const remove = Array.from(removedDates.values());
    addedDates.clear();
    removedDates.clear();

    if (add.length === 0 && remove.length === 0) return;

    try {
      await updateDates.mutateAsync({ add, remove });
    } catch (error) {
      // Previously the response status was only written to the log, so a
      // rejected change looked like it had been saved.
      logging.log("CALENDAR", `Saving dates failed: ${error}`);
      Alert.alert("Opslaan mislukt", errorMessage(error));
    }
  };

  return (
    <DatePickerModal
      locale="nl"
      mode="multiple"
      saveLabel={"Aanpassen"}
      label={"Voor welke dagen wil je je aanmelden?"}
      moreLabel={""}
      visible={open}
      onDismiss={() => setOpen(false)}
      dates={data?.dates ?? []}
      onChange={onChange}
      onConfirm={saveDates}
      startWeekOnMonday={true}
      validRange={{ startDate: subDays(new Date(), 1) }}
      disableWeekDays={disabledWeekdays}
    />
  );
}
