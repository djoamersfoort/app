import { useMemo, useState } from "react";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import { Member, Slot, useRegisterMember } from "@/queries/register";
import Presence from "./presence";
import Icon from "../icon";
import SearchField from "../search-field";
import { useKeyboardHeight } from "@/keyboard";

/**
 * Attendance list plus a member picker.
 *
 * Uses a gluestack Actionsheet with a plain search field rather than a
 * third-party select component.
 */
export default function PresenceCard({
  slot,
  members,
}: {
  slot: Slot;
  members: Member[];
}) {
  const registerMember = useRegisterMember();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const keyboard = useKeyboardHeight();

  const options = useMemo(() => {
    const term = search.trim().toLowerCase();
    // `sort` mutates in place; copy first so the cached member list is untouched.
    return [...members]
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .filter((member) => !term || member.name.toLowerCase().includes(term));
  }, [members, search]);

  if (!slot.presence) return null;

  function pick(member: Member) {
    setOpen(false);
    setSearch("");
    registerMember.mutate({ slot, member: member.id.toString() });
  }

  return (
    <VStack className="gap-3">
      <Button
        variant="outline"
        onPress={() => setOpen(true)}
        className="justify-start gap-2 rounded-xl"
      >
        <Icon name="account-plus-outline" size={18} className="text-primary" />
        <ButtonText className="text-foreground">
          Lid handmatig aanmelden
        </ButtonText>
      </Button>

      {slot.presence.length > 0 && (
        <>
          <Divider className="bg-border" />
          <VStack>
            {slot.presence.map((presence) => (
              <Presence key={presence.id} presence={presence} />
            ))}
          </VStack>
        </>
      )}

      <Actionsheet isOpen={open} onClose={() => setOpen(false)}>
        <ActionsheetBackdrop />
        {/* The sheet grows by the keyboard's height so the results stay above
            it; the sheet renders in a modal, where Android's window resize
            never reaches. */}
        <ActionsheetContent
          className="max-h-[85%]"
          style={{ paddingBottom: keyboard }}
        >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <Box className="w-full py-2">
            <SearchField
              placeholder="Zoek een lid"
              value={search}
              onChangeText={setSearch}
            />
          </Box>

          <ActionsheetScrollView keyboardShouldPersistTaps="handled">
            {options.length === 0 && (
              <Text className="p-4 text-center text-muted-foreground">
                Geen leden gevonden
              </Text>
            )}
            {options.map((member) => (
              <ActionsheetItem key={member.id} onPress={() => pick(member)}>
                <ActionsheetItemText className="text-foreground">
                  {member.name}
                </ActionsheetItemText>
              </ActionsheetItem>
            ))}
          </ActionsheetScrollView>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  );
}
