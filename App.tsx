import {adaptNavigationTheme, MD3DarkTheme, MD3LightTheme, PaperProvider} from "react-native-paper";
import {AuthProvider} from "./src/auth";
import {decode, encode} from "base-64";
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
    NavigationContainer
} from "@react-navigation/native";
import HomeScreen from "./src/screens/home";
import CustomNavigationBar from "./src/components/navbar";
import SlotScreen from "./src/screens/feed/slot";
import {createStackNavigator} from "@react-navigation/stack";
import AlbumScreen from "./src/screens/media/album";
import {Item} from "./src/__generated__/media";
import SlidesScreen from "./src/screens/media/slides";
import {useColorScheme} from "react-native";
import merge from 'deepmerge'
import WebScreen from "./src/screens/web";
import * as Notifications from 'expo-notifications'
import SearchScreen from "./src/screens/feed/search";

Notifications.setNotificationHandler(({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true
    })
}))

if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

export type StackParamList = {
    Home: undefined,
    Slot: { slot: number, title: string },
    Album: { album: string, title: string },
    Slides: { items: Item[], item: number },
    Web: { source: string, title: string },
    Search: undefined
}


const Stack = createStackNavigator<StackParamList>()

const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);

export default function App() {
    const colorScheme = useColorScheme()

    return (
        <NavigationContainer theme={colorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme}>
            <PaperProvider theme={colorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme}>
                <AuthProvider>
                    <Stack.Navigator
                        screenOptions={{
                            header: CustomNavigationBar
                        }}
                    >
                        <Stack.Screen name={"Home"} component={HomeScreen} options={{
                            headerShown: false
                        }} />
                        <Stack.Screen name={"Slot"} component={SlotScreen} options={({ route }) => ({
                            title: route.params.title,
                        })} />
                        <Stack.Screen name={"Album"} component={AlbumScreen} options={({ route }) => ({
                            title: route.params.title
                        })} />
                        <Stack.Screen name={"Slides"} component={SlidesScreen} />
                        <Stack.Screen name={"Web"} component={WebScreen} options={({ route }) => ({
                            title: route.params.title
                        })} />
                        <Stack.Screen name={"Search"} component={SearchScreen} options={{
                            headerShown: false
                        }} />
                    </Stack.Navigator>
                </AuthProvider>
            </PaperProvider>
        </NavigationContainer>
    );
}
