import {useContext, useEffect} from "react";
import AuthContext, {Authed} from "../../auth";
import {useAtom} from "jotai";
import {feedAtom, getAnnouncements, getRSSFeed, sortFeeds} from "../../stores/feed";
import {Card} from "react-native-paper";
import Item from "./item";

export default function Feed() {
    const authState = useContext(AuthContext)
    const [feed, setFeed] = useAtom(feedAtom)

    useEffect(() => {
        async function getFeeds() {
            if (authState.authenticated === Authed.AUTHENTICATED) {
                const feeds = await Promise.all([getRSSFeed(), getAnnouncements(await authState.token)])
                setFeed(sortFeeds(...feeds))
            }
            if (authState.authenticated === Authed.GUEST) {
                setFeed(await getRSSFeed())
            }
        }

        getFeeds().then()
    }, [authState])

    return (
        <Card>
            <Card.Title title={"Nieuws"} />
            <Card.Content style={{ gap: 10 }}>
                {feed.map((item, index) => (
                    <Item
                        key={index}
                        item={item}
                    />
                ))}
            </Card.Content>
        </Card>
    )
}
