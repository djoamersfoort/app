import { Appbar } from "react-native-paper";
import { getHeaderTitle } from "expo-router/react-navigation";
import { NativeStackHeaderProps, useRouter } from "expo-router";

/**
 * Expo Router's Stack is a native stack, so this takes NativeStackHeaderProps
 * (from Expo Router's own React Navigation build) rather than the JS stack's
 * header props.
 */
export default function CustomNavigationBar({
  route,
  options,
  back,
}: NativeStackHeaderProps) {
  const router = useRouter();
  const title = getHeaderTitle(options, route.name);

  return (
    <Appbar.Header>
      {back ? <Appbar.BackAction onPress={router.back} /> : null}
      <Appbar.Content title={title} />
      {options.headerRight?.({ canGoBack: !!back })}
    </Appbar.Header>
  );
}
