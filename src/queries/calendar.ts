import { useQuery } from "@tanstack/react-query";
import { parse, VEvent } from "unfucked-ical";
import { requestText } from "../api/client";
import { keys } from "../api/keys";

const EVENTS_URL = "https://www.djoamersfoort.nl/feed/eo-events/";

/** Public calendar; shared by every user and cheap to keep around. */
export function useEvents() {
  return useQuery({
    queryKey: keys.events(),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async ({ signal }): Promise<VEvent[]> => {
      const ical = await requestText(EVENTS_URL, { signal });
      return parse(ical).events;
    },
  });
}
