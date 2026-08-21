import { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Pressable } from "@/components/ui/pressable";
import Icon from "./icon";
import { errorMessage } from "@/api/errors";

/**
 * The header a tab screen draws for itself. Stack screens get theirs from the
 * navigator instead (see components/navbar).
 *
 * Sits on `bg-secondary` rather than the page background so the bar reads as a
 * separate surface — in light mode `card` and `background` are both white, so
 * a card colour alone would not have separated them.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Box
      className="border-b border-border bg-secondary px-4 pb-4"
      style={{ paddingTop: insets.top + 4 }}
    >
      <HStack className="items-center gap-2">
        <Box className="flex-1">
          <Heading size="2xl" className="text-foreground">
            {title}
          </Heading>
          {!!subtitle && (
            <Text size="sm" className="text-muted-foreground">
              {subtitle}
            </Text>
          )}
        </Box>
        {action}
      </HStack>
    </Box>
  );
}

/**
 * Bottom space a scrolling tab screen must leave for the tab bar.
 *
 * The native tab bar floats above the content on iOS and reports no height, and
 * `contentInsetAdjustmentBehavior` does not compensate for it, so screens
 * reserve the room themselves.
 */
export function useTabBarInset() {
  return useSafeAreaInsets().bottom + 60;
}

/**
 * Icon action for a header — screen headers and navigator headers alike.
 * Bare and larger, so it reads as part of the bar rather than a control on it.
 */
export function HeaderIconButton({
  icon,
  onPress,
  label,
}: {
  icon: string;
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center active:opacity-50"
    >
      <Icon name={icon as never} size={26} className="text-foreground" />
    </Pressable>
  );
}

/** Icon action that sits on the page, e.g. beside a section title. */
export function IconButton({
  icon,
  onPress,
  label,
}: {
  icon: string;
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      className="h-10 w-10 items-center justify-center rounded-full bg-secondary active:opacity-70"
    >
      <Icon name={icon as never} size={20} className="text-foreground" />
    </Pressable>
  );
}

/** Shared empty / failed / loading placeholder so every list reads the same. */
export function Placeholder({
  isPending,
  error,
  empty,
  icon,
  className,
}: {
  isPending?: boolean;
  error?: unknown;
  empty?: string;
  icon?: string;
  className?: string;
}) {
  if (isPending)
    return (
      <Center className={`py-8 ${className ?? ""}`}>
        <Spinner />
      </Center>
    );

  return (
    <Center className={`gap-2 py-8 ${className ?? ""}`}>
      {!!icon && (
        <Icon
          name={icon as never}
          size={36}
          className="text-muted-foreground"
        />
      )}
      <Text size="sm" className="text-center text-muted-foreground">
        {error ? errorMessage(error) : (empty ?? "Niets gevonden")}
      </Text>
    </Center>
  );
}
