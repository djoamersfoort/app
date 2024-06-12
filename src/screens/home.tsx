import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import FeedScreen from "./feed/feed";
import MediaScreen from "./media/media";
import SettingsScreen from "./settings";
import { useContext } from "react";
import AuthContext, { Authed } from "../auth";
import CalendarScreen from "./calendar/calendar";
import CorveeScreen from "./corvee/corvee";

const Tab = createMaterialBottomTabNavigator();

export default function HomeScreen() {
  const authState = useContext(AuthContext);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name={"Feed"}
        component={FeedScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: "home",
        }}
      />
      <Tab.Screen
        name={"Agenda"}
        component={CalendarScreen}
        options={{
          tabBarLabel: "Agenda",
          tabBarIcon: "calendar",
        }}
      />
      {authState.authenticated === Authed.AUTHENTICATED &&
        authState.user.account_type.includes("begeleider") && (
          <Tab.Screen
            name={"Corvee"}
            component={CorveeScreen}
            options={{
              tabBarLabel: "Corvee",
              tabBarIcon: "clipboard-list",
            }}
          />
        )}
      {authState.authenticated === Authed.AUTHENTICATED && (
        <Tab.Screen
          name={"Media"}
          component={MediaScreen}
          options={{
            tabBarLabel: "Media",
            tabBarIcon: "video",
          }}
        />
      )}
      <Tab.Screen
        name={"Settings"}
        component={SettingsScreen}
        options={{
          tabBarLabel: "Instellingen",
          tabBarIcon: "cog",
        }}
      />
    </Tab.Navigator>
  );
}
