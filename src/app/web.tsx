import { WebView } from "react-native-webview";
import { Stack, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "react-native";
import { Box } from "@/components/ui/box";
import { useAnnouncement } from "@/queries/feed";
import { Placeholder } from "@/components/screen";
import { param } from "@/routes";

/** Mirrors the app's tokens so the embedded document matches the surrounding UI. */
function documentStyle(dark: boolean) {
  const background = dark ? "#0a0a0a" : "#ffffff";
  const foreground = dark ? "#fafafa" : "#0a0a0a";
  const accent = dark ? "#8d8df5" : "#202088";

  return `
    :root { color-scheme: ${dark ? "dark" : "light"}; }
    body {
      background-color: ${background};
      color: ${foreground};
      font-family: -apple-system, Roboto, sans-serif;
      font-size: 17px;
      line-height: 1.6;
      margin: 20px;
    }
    h1, h2, h3 { line-height: 1.3; }
    a { color: ${accent}; }
    img, video { max-width: 100%; height: auto; border-radius: 12px; }
  `;
}

export default function WebScreen() {
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const dark = useColorScheme() === "dark";

  // The announcement body is a full HTML document. It stays in the query cache
  // and is looked up by id here, rather than being serialised into the route.
  const { source, title, isPending, error } = useAnnouncement(param(params.id));

  const header = (
    <Stack.Screen options={{ title: param(params.title) || title || "" }} />
  );

  if (isPending || !source)
    return (
      <Box className="flex-1 bg-background">
        {header}
        <Placeholder
          isPending={isPending}
          error={error}
          icon="bullhorn-outline"
          empty="Dit bericht is niet meer beschikbaar"
        />
      </Box>
    );

  return (
    <Box className="flex-1 bg-background">
      {header}
      <WebView
        style={{ backgroundColor: "transparent" }}
        source={{ html: `<style>${documentStyle(dark)}</style>${source}` }}
      />
    </Box>
  );
}
