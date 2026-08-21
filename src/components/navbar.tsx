import { getHeaderTitle } from "expo-router/react-navigation";
import { NativeStackHeaderProps, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import Icon from "./icon";

/**
 * Header for stack routes. Expo Router's Stack is a native stack, so this takes
 * NativeStackHeaderProps (from Expo Router's own React Navigation build).
 */
export default function CustomNavigationBar({
  route,
  options,
  back,
}: NativeStackHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const title = getHeaderTitle(options, route.name);

  return (
    <Box
      className="border-b border-border bg-background px-2 pb-2"
      style={{ paddingTop: insets.top }}
    >
      <HStack className="min-h-12 items-center gap-1">
        {back ? (
          <Pressable
            onPress={router.back}
            accessibilityRole="button"
            accessibilityLabel="Terug"
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
          >
            <Icon name="chevron-left" size={26} className="text-foreground" />
          </Pressable>
        ) : (
          <Box className="w-2" />
        )}

        <Heading size="lg" numberOfLines={1} className="flex-1 text-foreground">
          {title}
        </Heading>

        <HStack className="items-center gap-1">
          {options.headerRight?.({ canGoBack: !!back })}
        </HStack>
      </HStack>
    </Box>
  );
}
