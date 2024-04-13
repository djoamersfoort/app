import { Appbar } from 'react-native-paper';
import { getHeaderTitle } from '@react-navigation/elements';
import {StackHeaderProps} from "@react-navigation/stack";

export default function CustomNavigationBar({ navigation, route, options, back }: StackHeaderProps) {
    const title = getHeaderTitle(options, route.name);

    return (
        <Appbar.Header>
            {back ? <Appbar.BackAction onPress={navigation.goBack} /> : null}
            <Appbar.Content title={title} />
            {options.headerRight && <options.headerRight />}
        </Appbar.Header>
    )
}
