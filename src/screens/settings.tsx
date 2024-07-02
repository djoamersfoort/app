import { useContext } from "react";
import AuthContext, { Authed } from "../auth";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Text } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import auth from "../auth";
import logging from "../logging";
import * as Sharing from "expo-sharing";
import Area from "../components/area";

export default function SettingsScreen() {
  const authState = useContext(AuthContext);

  async function orderList() {
    await WebBrowser.openBrowserAsync(
      "https://docs.google.com/document/d/1cyrfqq37l9QdhByT1zExyk_W7TDEhyO6/edit",
    );
  }

  async function exportLog() {
    if (!logging.currentFile) return;

    await Sharing.shareAsync(logging.currentFile);
  }

  async function clearLog() {
    await logging.clear();
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Instellingen"} />
      </Appbar.Header>
      <ScrollView>
        <View style={styles.container}>
          <Area title={"Algemeen"} icon={"cog"}>
            <Button mode={"contained"} onPress={orderList}>
              Bestellijst
            </Button>
            <View style={styles.related}>
              <Button
                mode={"contained-tonal"}
                onPress={clearLog}
                style={styles.relatedButton}
              >
                Leeg log
              </Button>
              <Button
                mode={"contained"}
                onPress={exportLog}
                style={styles.relatedButton}
              >
                Exporteer log
              </Button>
            </View>
          </Area>
          <Area title={"Account"} icon={"account"}>
            <>
              {authState.authenticated === Authed.AUTHENTICATED && (
                <>
                  <Text>
                    {authState.user.given_name} {authState.user.family_name} (
                    {authState.user.sub})
                  </Text>
                  <Button mode={"contained"} onPress={authState.logout}>
                    Log uit
                  </Button>
                </>
              )}
              {authState.authenticated === Authed.GUEST && (
                <>
                  <Text>Demo Mode</Text>
                  <Button mode={"contained"} onPress={authState.login}>
                    Ga uit demo mode
                  </Button>
                </>
              )}
            </>
          </Area>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 10,
  },
  content: {
    gap: 10,
    padding: 17,
    paddingTop: 0,
  },
  related: {
    flexDirection: "row",
    gap: 10,
  },
  relatedButton: {
    flex: 1,
  },
});
