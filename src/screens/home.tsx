import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FeedScreen from "./feed/feed";
import MediaScreen from "./media/media";
import SettingsScreen from "./settings";
import { useContext } from "react";
import AuthContext, { Authed } from "../auth";
import CalendarScreen from "./calendar/calendar";
import CorveeScreen from "./corvee/corvee";
import { BottomNavigation } from "react-native-paper";
import { CommonActions } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  const authState = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={{
        animation: "shift",
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              preventDefault();
            } else {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) =>
            descriptors[route.key].options.tabBarIcon?.({
              focused,
              color,
              size: 24,
            }) || null
          }
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            return typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;
          }}
        />
      )}
    >
      <Tab.Screen
        name={"Feed"}
        component={FeedScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name={"Agenda"}
        component={CalendarScreen}
        options={{
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={26} />
          ),
        }}
      />
      {authState.authenticated === Authed.AUTHENTICATED &&
        authState.user.account_type.includes("begeleider") && (
          <Tab.Screen
            name={"Corvee"}
            component={CorveeScreen}
            options={{
              tabBarLabel: "Corvee",
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="clipboard-list"
                  color={color}
                  size={26}
                />
              ),
            }}
          />
        )}
      {authState.authenticated === Authed.AUTHENTICATED && (
        <Tab.Screen
          name={"Media"}
          component={MediaScreen}
          options={{
            tabBarLabel: "Media",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="video" color={color} size={26} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name={"Settings"}
        component={SettingsScreen}
        options={{
          tabBarLabel: "Instellingen",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
