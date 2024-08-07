import { useAtomValue } from "jotai/index";
import { datesAtom, getSlots, slotsAtom } from "../../stores/register";
import { useContext, useMemo } from "react";
import AuthContext, { Authed } from "../../auth";
import {
  MultiChange,
  MultiConfirm,
} from "react-native-paper-dates/lib/typescript/Date/Calendar";
import { format, subDays } from "date-fns";
import { AANMELDEN } from "../../env";
import { DatePickerModal } from "react-native-paper-dates";

export default function Calendar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const slots = useAtomValue(slotsAtom);
  const dates = useAtomValue(datesAtom);

  const addedDates = useMemo(() => new Set<string>(), []);
  const removedDates = useMemo(() => new Set<string>(), []);
  const disabledWeekdays = useMemo(
    () =>
      [6, 0, 1, 2, 3, 4, 5].filter(
        (_, day) =>
          !slots?.find((slot) => new Date(slot.date).getDay() === day),
      ),
    [slots],
  );
  const authState = useContext(AuthContext);

  const onChange: MultiChange = ({ datePressed, change }) => {
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

    if (authState.authenticated !== Authed.AUTHENTICATED) return;

    const token = await authState.token;
    await fetch(`${AANMELDEN}/api/v1/future`, {
      method: "patch",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        add: Array.from(addedDates.values()),
        remove: Array.from(removedDates.values()),
      }),
    });
    await getSlots(token);

    addedDates.clear();
    removedDates.clear();
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
      dates={dates}
      onChange={onChange}
      onConfirm={saveDates}
      startWeekOnMonday={true}
      validRange={{ startDate: subDays(new Date(), 1) }}
      disableWeekDays={disabledWeekdays}
    />
  );
}
