import { TextInput, TextInputProps } from "react-native";
import { useColorScheme } from "react-native";
import { HStack } from "@/components/ui/hstack";
import Icon from "./icon";
import { theme } from "@/theme";

/**
 * A search box built on React Native's own TextInput.
 *
 * gluestack's `Input` is deliberately not used here: it was the one component
 * shared by both screens that crashed the app on open, and a plain TextInput
 * gives the same result with no extra native surface.
 */
export default function SearchField({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  const colors = useColorScheme() === "dark" ? theme.dark : theme.light;

  return (
    <HStack
      className={`h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 ${className ?? ""}`}
    >
      <Icon name="magnify" size={18} className="text-muted-foreground" />
      <TextInput
        {...props}
        style={{ flex: 1, color: colors.foreground, fontSize: 15, padding: 0 }}
        placeholderTextColor={colors.mutedForeground}
        autoCorrect={false}
      />
    </HStack>
  );
}
