import {ActionType, FeedItem} from "../../stores/feed";
import {TouchableOpacity} from "react-native";
import * as WebBrowser from 'expo-web-browser'
import {Avatar, Card, IconButton} from "react-native-paper";
import {useNavigation} from "@react-navigation/native";
import {NativeStackNavigationProp} from "react-native-screens/native-stack";
import {StackParamList} from "../../../App";

type NavigationProps = NativeStackNavigationProp<StackParamList>

export default function Item({ item }: { item: FeedItem }) {
    const navigation = useNavigation<NavigationProps>()

    async function open() {
        switch (item.action.type) {
            case ActionType.LINK: {
                await WebBrowser.openBrowserAsync(item.action.href)
                break
            }
            case ActionType.VIEW: {
                navigation.navigate('Web', { source: item.action.source, title: item.title })
                break
            }
            case ActionType.ITEM: {
                navigation.navigate('Item', { item: item.action.item, title: item.title })
                break
            }
        }
    }

    return (
        <TouchableOpacity onPress={open}>
            <Card mode={"contained"}>
                <Card.Title
                    title={item.title}
                    subtitle={item.description}
                    left={(props) => (item.icon.startsWith('http') ?
                        <Avatar.Image {...props} source={{ uri: item.icon }} /> :
                        <Avatar.Icon {...props} icon={item.icon} />
                    )}
                    right={(props) => <IconButton {...props} icon={"chevron-right"} />}
                />
            </Card>
        </TouchableOpacity>
    )
}
