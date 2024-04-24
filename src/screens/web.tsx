import { WebView } from "react-native-webview";
import { StackScreenProps } from "@react-navigation/stack";
import { StackParamList } from "../../App";
import { MD3Theme, useTheme } from "react-native-paper";
import { useEffect, useState } from "react";

type Props = StackScreenProps<StackParamList, "Web">;

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

export default function WebScreen({ route }: Props) {
  const theme = useTheme();
  const [source, setSource] = useState("");

  useEffect(() => {
    setSource(`<style>${getCSS(theme)}</style>${route.params.source}`);
  }, [theme]);

  return <WebView source={{ html: source }} />;
}
