import { useQuery } from "@tanstack/react-query";
import { DomUtils, parseDocument } from "htmlparser2";
import { Asset } from "expo-asset";
import { SerializedComponent } from "unfucked-ical";
import { LEDEN_ADMIN } from "../env";
import { requestJson, requestText, TokenProvider } from "../api/client";
import { keys, useScope } from "../api/query";
import { useTokenProvider } from "../auth";
import type { InventoryItem } from "./search";

export enum ActionType {
  LINK,
  VIEW,
  ITEM,
  EVENT,
}
interface LinkAction {
  type: ActionType.LINK;
  href: string;
}
interface ViewAction {
  type: ActionType.VIEW;
  /** Identifies the announcement so the web route can look it up by id. */
  id: string;
  source: string;
}
interface ItemAction {
  type: ActionType.ITEM;
  item: InventoryItem;
}
interface EventAction {
  type: ActionType.EVENT;
  event: SerializedComponent;
}
export type Action = LinkAction | ViewAction | ItemAction | EventAction;

export interface FeedItem {
  icon: string;
  title: string;
  description: string;
  date?: number;
  action: Action;
}

export function sortFeeds(...feeds: FeedItem[][]): FeedItem[] {
  return feeds.flat().sort((a, b) => (b.date || 0) - (a.date || 0));
}

const RSS_URL = "https://djoamersfoort.nl/rss";

type XmlElement = ReturnType<typeof DomUtils.getElementsByTagName>[number];

function childText(parent: XmlElement, tag: string): string {
  const [node] = DomUtils.getElementsByTagName(tag, parent, true, 1);
  return node ? DomUtils.textContent(node).trim() : "";
}

/**
 * Parsed here rather than through `rss-to-json` so the request goes through the
 * same hardened client as everything else: HTTPS enforced, hard timeout, and
 * cancellable when the screen goes away.
 */
async function fetchRSS(signal?: AbortSignal): Promise<FeedItem[]> {
  const xml = await requestText(RSS_URL, { signal });
  const document = parseDocument(xml, { xmlMode: true });

  const items = DomUtils.getElementsByTagName("item", document, true)
    .map((item) => {
      const author =
        childText(item, "dc:creator") || childText(item, "author") || "Iemand";
      const published = new Date(childText(item, "pubDate")).getTime();

      return {
        icon: "post",
        title: childText(item, "title"),
        description: `${author} heeft een nieuw artikel gepost`,
        date: Number.isNaN(published) ? undefined : published,
        action: {
          type: ActionType.LINK,
          href: childText(item, "link"),
        },
      } satisfies FeedItem;
    })
    .filter((item) => item.action.type === ActionType.LINK && item.action.href);

  return sortFeeds(items);
}

async function fetchAnnouncements(
  auth: TokenProvider | null,
  signal?: AbortSignal,
): Promise<FeedItem[]> {
  if (!auth) {
    // A file:// or dev-server URI for content shipped inside the bundle, so it
    // deliberately skips the remote-only guards in the API client.
    const asset = Asset.fromModule(require("../../assets/demo.html"));
    const source = await fetch(asset.uri, { signal }).then((res) => res.text());

    return [
      {
        icon: "bullhorn",
        title: "DJO Aankondigingen",
        description: "Update over de DJO Locatie",
        date: new Date().getTime(),
        action: {
          type: ActionType.VIEW,
          id: "demo",
          source,
        },
      },
    ];
  }

  const announcements = await requestJson<Record<string, string>[]>(
    `${LEDEN_ADMIN}/notifications/announcements`,
    { auth, signal },
  );

  if (!Array.isArray(announcements)) return [];

  return sortFeeds(
    announcements.map((announcement, index) => ({
      icon: "bullhorn",
      title: announcement.description,
      description: announcement.title,
      date: new Date(announcement.date).getTime(),
      action: {
        type: ActionType.VIEW,
        id: announcement.id ?? `announcement-${index}`,
        source: announcement.content,
      },
    })),
  );
}

/**
 * Articles from the public site. Kept separate from announcements so the home
 * screen can present them as their own section rather than one merged list.
 */
export function useArticles() {
  return useQuery({
    queryKey: keys.rss(),
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => fetchRSS(signal),
  });
}

/** Member announcements, or the bundled demo notice when signed out. */
export function useAnnouncements() {
  const token = useTokenProvider();
  const scope = useScope();

  return useQuery({
    queryKey: keys.announcements(scope),
    queryFn: ({ signal }) => fetchAnnouncements(token, signal),
  });
}

/**
 * Resolves the HTML behind a `VIEW` feed item. The web route receives only the
 * id, so the (potentially large) document stays in the query cache instead of
 * being serialised into navigation state.
 */
export function useAnnouncement(id: string) {
  const { data, isPending, error } = useAnnouncements();

  const item = data?.find(
    (entry) => entry.action.type === ActionType.VIEW && entry.action.id === id,
  );

  return {
    title: item?.title,
    source:
      item && item.action.type === ActionType.VIEW ? item.action.source : null,
    isPending,
    error,
  };
}
