import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import FeedScreen from "./feed/feed";
import MediaScreen from "./media/media";
import SettingsScreen from "./settings";
import { useContext } from "react";
import AuthContext, { Authed } from "../auth";

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
