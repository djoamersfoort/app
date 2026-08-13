import { WebView } from "react-native-webview";
import {
  ActivityIndicator,
  MD3Theme,
  Text,
  useTheme,
} from "react-native-paper";
import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAnnouncement } from "../queries/feed";
import { errorMessage } from "../api/errors";
import { param } from "../routes";

function getCSS(theme: MD3Theme) {
  return (
    "body {\n" +
    `    background-color: ${theme.colors.background};\n` +
    `    color: ${theme.colors.onBackground};\n` +
    "    font-family: sans-serif;\n" +
    "    font-size: 20px !important;\n" +
    "    margin: 20px;\n" +
    "  }\n" +
    "* {\n" +
    "    font-size: 1.5em !important;\n" +
    "}"
  );
}

export default function WebScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; title?: string }>();

  // The announcement body is a full HTML document. It stays in the query cache
  // and is looked up by id here, rather than being serialised into the route.
  const { source, title, isPending, error } = useAnnouncement(param(params.id));

  const header = (
    <Stack.Screen options={{ title: param(params.title) || title || "" }} />
  );

  if (isPending)
    return (
      <View style={styles.center}>
        {header}
        <ActivityIndicator animating={true} />
      </View>
    );

  if (!source)
    return (
      <View style={styles.center}>
        {header}
        <Text>
          {error ? errorMessage(error) : "Dit bericht is niet meer beschikbaar"}
        </Text>
      </View>
    );

  return (
    <>
      {header}
      <WebView source={{ html: `<style>${getCSS(theme)}</style>${source}` }} />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
