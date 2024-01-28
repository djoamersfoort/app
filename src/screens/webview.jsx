import { WebView as WebViewComponent } from "react-native-webview";

export default function WebView({ route }) {
  const { source } = route.params;

  return <WebViewComponent source={source} />;
}
