import { useContext } from "react";
import AuthContext, { Authed } from "../auth";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Text } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import auth from "../auth";

export default function SettingsScreen() {
  const authState = useContext(AuthContext);

  async function orderList() {
    await WebBrowser.openBrowserAsync(
      "https://docs.google.com/document/d/1cyrfqq37l9QdhByT1zExyk_W7TDEhyO6/edit",
    );
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Instellingen"} />
      </Appbar.Header>
      <ScrollView>
        <View style={styles.container}>
          <Card>
            <Card.Title title={"Algemeen"} />
            <Card.Content style={styles.content}>
              <Button mode={"contained"} onPress={orderList}>
                Bestellijst
              </Button>
            </Card.Content>
          </Card>
          <Card>
            <Card.Title title={"Account"} />
            {authState.authenticated === Authed.AUTHENTICATED && (
              <Card.Content style={styles.content}>
                <Text>
                  {authState.user.given_name} {authState.user.family_name} (
                  {authState.user.sub})
                </Text>
                <Button mode={"contained"} onPress={authState.logout}>
                  Log uit
                </Button>
              </Card.Content>
            )}
            {authState.authenticated === Authed.GUEST && (
              <Card.Content style={styles.content}>
                <Text>Demo Mode</Text>
                <Button mode={"contained"} onPress={authState.login}>
                  Ga uit demo mode
                </Button>
              </Card.Content>
            )}
          </Card>
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
    gap: 5,
    padding: 17,
    paddingTop: 0,
  },
});
