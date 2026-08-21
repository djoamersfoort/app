import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { useAnnouncements } from "@/queries/feed";
import Section from "../section";
import { Placeholder } from "../screen";
import Item from "./item";

/** Home-screen announcements. Articles now live in their own section. */
export default function Announcements() {
  const { data, isPending, error } = useAnnouncements();
  const announcements = data ?? [];

  return (
    <Section title="Mededelingen" icon="bullhorn">
      <Box className="px-4">
        {isPending || announcements.length === 0 ? (
          <Placeholder
            isPending={isPending}
            error={error}
            icon="bullhorn-outline"
            empty="Geen mededelingen op dit moment"
            className="rounded-2xl border border-border bg-card"
          />
        ) : (
          <VStack className="gap-3">
            {announcements.map((item, index) => (
              <Item key={index} item={item} />
            ))}
          </VStack>
        )}
      </Box>
    </Section>
  );
}
