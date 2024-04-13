import {StackScreenProps} from "@react-navigation/stack";
import {Alert, StyleSheet, View} from "react-native";
import {Button, Card, Chip, Text} from "react-native-paper";
import {useContext, useEffect, useState} from "react";
import {getSlots, Slot, slotsAtom} from "../../stores/register";
import {useAtom} from "jotai";
import {StackParamList} from "../../../App";
import AuthContext, {Authed} from "../../auth";

type Props = StackScreenProps<StackParamList, 'Slot'>

export default function SlotScreen({ route, navigation }: Props) {
    const [slots, setSlots] = useAtom(slotsAtom)
    const [slot, setSlot] = useState<Slot>(slots[route.params.slot])
    const [loading, setLoading] = useState(false)

    const authState = useContext(AuthContext)

    async function register() {
        if (authState.authenticated !== Authed.AUTHENTICATED) return

        setLoading(true)
        const token = await authState.token
        const { error }: { error: string|undefined } = await fetch(`https://aanmelden.djoamersfoort.nl/api/v1/${slot.is_registered ? "deregister" : "register"}/${slot.name}/${slot.pod}`, {
            headers: {
                authorization: `Bearer ${token}`
            }
        }).then(res => res.json())

        if (error) {
            setLoading(false)
            return Alert.alert(error)
        }

        setSlots(await getSlots(token))
        setLoading(false)
    }

    useEffect(() => {
        setSlot(slots[route.params.slot])
    }, [slots])

    if (!slot) return <Text>Something went wrong!</Text>

    return (
        <View style={styles.slot}>
            <View style={styles.info}>
                <Text variant={"titleMedium"}>Beschikbaarheid</Text>
                <Card>
                    <Card.Content>
                        <Text variant={"titleSmall"}>Er zijn {slot.available}/{slot.available + slot.taken} plekken beschikbaar.</Text>
                    </Card.Content>
                </Card>

                <Text variant={"titleMedium"}>Begeleiders</Text>
                <Card>
                    <Card.Content style={styles.chips}>
                        {slot.tutors.map((tutor) => (
                            <Chip key={tutor}>{tutor}</Chip>
                        ))}
                    </Card.Content>
                </Card>
            </View>
            <View>
                <Button
                    style={styles.button}
                    labelStyle={{ fontSize: 17 }}
                    disabled={loading}
                    loading={loading}
                    contentStyle={{ height: 50 }}
                    mode={slot.is_registered ? "outlined" : "contained"}
                    onPress={register}
                >
                    {slot.is_registered ? "Afmelden" : "Aanmelden"}
                </Button>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    slot: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 10
    },
    info: {
        gap: 10
    },
    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 5,
    },
    button: {
        borderRadius: 25,
    }
})
