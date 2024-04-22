import {Card, Searchbar, useTheme} from "react-native-paper";
import {useState} from "react";
import {SafeAreaView, ScrollView, StyleSheet, View} from "react-native";
import {useNavigation} from "@react-navigation/native";
import {ActionType, FeedItem} from "../../stores/feed";
import Item from "../../components/feed/item";
import { parse } from 'fast-html-parser'

export interface Item {
    id: number,
    name: string,
    description: string,
    location: string,
    location_description: string,
    location_id: 7,
    url: string,
    properties: string[]
}

interface Article {
    id: string,
    title: string,
    url: string,
    _embedded: {
        self: [{
            excerpt: {
                rendered: string
            }
        }]
    }
}

async function getItems(query: string) {
    const { items }: { items: Item[] } = await fetch(`https://inventory.djoamersfoort.nl/api/v1/items/search/${encodeURI(query)}`)
        .then(res => res.json())

    return items.map(item => ({
        title: item.name,
        description: item.location_description,
        icon: 'package-variant-closed',
        action: {
            type: ActionType.ITEM,
            item
        }
    } as FeedItem))
}

async function getArticles(query: string) {
    const articles: Article[] = await fetch(`https://djoamersfoort.nl/wp-json/wp/v2/search?_embed&search=${encodeURI(query)}`)
        .then(res => res.json())

    return articles.map(article => {
        const excerpt = parse(article._embedded.self[0].excerpt.rendered)

        const result: FeedItem = {
            title: article.title,
            description: excerpt.querySelector('p')?.text || '',
            icon: 'post',
            action: {
                type: ActionType.LINK,
                href: article.url
            }
        }

        return result
    })
}

export default function SearchScreen() {
    const theme = useTheme()
    const [search, setSearch] = useState('')
    const navigation = useNavigation()

    const [itemResults, setItemsResults] = useState<FeedItem[]>([])
    const [articleResults, setArticleResults] = useState<FeedItem[]>([])

    async function updateResults() {
        if (!search) return
        getItems(search).then(setItemsResults)
        getArticles(search).then(setArticleResults)
    }

    return (
        <SafeAreaView style={styles.view}>
            <View style={{
                ...styles.component,
                backgroundColor: theme.colors.background
            }}>
                <Searchbar
                    placeholder="Search"
                    onChangeText={setSearch}
                    onSubmitEditing={updateResults}
                    icon={"chevron-left"}
                    onIconPress={navigation.goBack}
                    value={search}
                />
            </View>
            <ScrollView>
                <View style={{
                    ...styles.component,
                    ...styles.results
                }}>
                    {itemResults.length > 0 && (
                        <Card>
                            <Card.Title title={"Inventaris"} />
                            <Card.Content style={styles.content}>
                                {itemResults.map((result, index) => (
                                    <Item key={index} item={result} />
                                ))}
                            </Card.Content>
                        </Card>
                    )}
                    {articleResults.length > 0 && (
                        <Card>
                            <Card.Title title={"Artikelen"} />
                            <Card.Content style={styles.content}>
                                {articleResults.map((result, index) => (
                                    <Item key={index} item={result} />
                                ))}
                            </Card.Content>
                        </Card>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>

    )
}

const styles = StyleSheet.create({
    view: {
        flex: 1,
        flexDirection: "column",
        height: '100%'
    },
    component: {
        padding: 10
    },
    results: {
        paddingBottom: 10,
        gap: 10
    },
    content: {
        gap: 10
    }
})
