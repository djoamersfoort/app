import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import { Presence as PresenceType, useMarkSeen } from "@/queries/register";

export default function Presence({ presence }: { presence: PresenceType }) {
  const markSeen = useMarkSeen();

  // The switch flips immediately through the optimistic cache update and rolls
  // back on failure, so no local copy of `seen` is needed here.
  const toggle = () => markSeen.mutate({ presence, seen: !presence.seen });

  return (
    <Pressable
      onPress={toggle}
      className="flex-row items-center gap-3 rounded-xl px-1 py-1.5 active:opacity-70"
    >
      <Switch value={presence.seen} onValueChange={toggle} />
      <Text
        numberOfLines={1}
        className={
          presence.seen
            ? "flex-1 text-foreground"
            : "flex-1 text-muted-foreground"
        }
      >
        {presence.name}
      </Text>
      {!!presence.stripcard_count && (
        <Badge variant="secondary" className="rounded-full">
          <BadgeText className="normal-case">
            {presence.stripcard_used} / {presence.stripcard_count}
          </BadgeText>
        </Badge>
      )}
    </Pressable>
  );
}
