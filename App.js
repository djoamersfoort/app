import 'react-native-gesture-handler';
import { decode, encode } from "base-64";
import {
  adaptNavigationTheme,
  Icon,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from "react-native-paper";
import * as Device from "expo-device";

import Auth from "./src/auth/auth.jsx";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "./src/screens/home";
import Album from "./src/media/albumscreen.jsx";
import Item from "./src/media/itemscreen.jsx";
import merge from "deepmerge";
import Slot from "./src/aanmelden/slot";
import { createStackNavigator } from "@react-navigation/stack";
import WebView from "./src/screens/webview";
import * as Notifications from "expo-notifications";
import { Platform, useColorScheme } from "react-native";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import Media from "./src/media/media.jsx";
import * as Linking from "expo-linking";
import {useAtom} from "jotai";
import {doneAtom, refreshingAtom} from "./src/feed/refresh";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token.data;
}

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);

if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
function BottomBar() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name={"Home"}
        component={Home}
        options={{
          tabBarIcon: (props) => (
            <Icon color={props.color} size={props.size} source={"home"} />
          ),
        }}
      />
      <Tab.Screen
        name={"Media"}
        component={Media}
        options={{
          tabBarIcon: (props) => (
            <Icon color={props.color} size={props.size} source={"video"} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const prefix = Linking.createURL('/');

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const [refreshing, setRefreshing] = useAtom(refreshingAtom);
  const [_done, setDone] = useAtom(doneAtom);

  const linking = {
    prefixes: [prefix],
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token),
    );

    notificationListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        if (refreshing) return;

        setDone(0);
        setRefreshing(true);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current,
      );
    };
  });

  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState(
    colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme,
  );
  useEffect(() => {
    setTheme(colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme);
  }, [colorScheme]);

  return (
    <NavigationContainer linking={linking} theme={theme}>
      <PaperProvider theme={theme}>
        <Auth expoPushToken={expoPushToken}>
          <Stack.Navigator>
            <Stack.Screen
              name={"Back"}
              component={BottomBar}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name={"Slot"}
              component={Slot}
              options={({ route }) => ({
                title: route.params.slot.description,
              })}
            />
            <Stack.Screen
              name={"WebView"}
              component={WebView}
              options={({ route }) => ({ title: route.params.title })}
            />
            <Stack.Screen
              name={"Album"}
              component={Album}
              options={({ route }) => ({ title: route.params.title })}
            />
            <Stack.Screen
              name={"Item"}
              component={Item}
              options={({ route }) => ({ title: "loading..." })}
            />
          </Stack.Navigator>
        </Auth>
      </PaperProvider>
    </NavigationContainer>
  );
}
