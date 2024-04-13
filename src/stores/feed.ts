import {atom} from "jotai";
import {parse} from "rss-to-json";

export enum ActionType {
    LINK,
    VIEW
}
interface LinkAction {
    type: ActionType.LINK
    href: string
}
interface ViewAction {
    type: ActionType.VIEW
    source: string
}
export type Action = LinkAction | ViewAction

export interface FeedItem {
    icon: string
    title: string
    description: string
    date?: number
    action: Action
}

export const feedAtom = atom<FeedItem[]>([])
export async function getRSSFeed(): Promise<FeedItem[]> {
    const { items } = await parse('https://djoamersfoort.nl/rss')

    return items.map(item => ({
        icon: 'post',
        title: `${item.author} heeft een nieuw artikel gepost`,
        description: item.title,
        date: new Date(item.published).getTime(),
        action: {
            type: ActionType.LINK,
            href: item.link
        }
    }))
}
export async function getAnnouncements(token: string): Promise<FeedItem[]> {
    const announcements: Record<string, string>[] = await fetch('https://leden.djoamersfoort.nl/notifications/announcements', {
        headers: {
            authorization: `Bearer ${token}`
        }
    }).then(res => res.json())

    return announcements.map(announcement => ({
        icon: 'bullhorn',
        title: announcement.title,
        description: announcement.description,
        date: new Date(announcement.date).getTime(),
        action: {
            type: ActionType.VIEW,
            source: announcement.content
        }
    }))
}
export function sortFeeds(...feeds: FeedItem[][]): FeedItem[] {
    return feeds.flat().sort((a, b) => (b.date||0 )- (a.date||0))
}
