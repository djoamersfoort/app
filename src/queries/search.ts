import { useQuery } from "@tanstack/react-query";
import { DomUtils, parseDocument } from "htmlparser2";
import { requestJson, segment } from "../api/client";
import { keys } from "../api/query";
import { ActionType, FeedItem } from "./feed";

export interface InventoryItem {
  id: number;
  name: string;
  description: string;
  location: string;
  location_description: string;
  location_id: 7;
  url: string;
  properties: string[];
}

interface Article {
  id: string;
  title: string;
  url: string;
  _embedded?: {
    self?: {
      excerpt?: {
        rendered?: string;
      };
    }[];
  };
}

const INVENTORY = "https://inventory.djoamersfoort.nl";
const WORDPRESS = "https://djoamersfoort.nl";

async function fetchItems(
  query: string,
  signal?: AbortSignal,
): Promise<FeedItem[]> {
  const payload = await requestJson<{ items?: InventoryItem[] }>(
    `${INVENTORY}/api/v1/items/search/${segment(query)}`,
    { signal },
  );

  return (payload.items ?? []).map((item) => ({
    title: item.name,
    description: item.location_description,
    icon: "package-variant-closed",
    action: {
      type: ActionType.ITEM,
      item,
    },
  }));
}

async function fetchArticles(
  query: string,
  signal?: AbortSignal,
): Promise<FeedItem[]> {
  const articles = await requestJson<Article[]>(
    `${WORDPRESS}/wp-json/wp/v2/search?_embed&search=${encodeURIComponent(query)}`,
    { signal },
  );

  if (!Array.isArray(articles)) return [];

  return articles.map((article) => {
    // The excerpt is optional and the shape varies per result type, so read it
    // defensively rather than indexing blindly into the embed.
    const rendered = article._embedded?.self?.[0]?.excerpt?.rendered;
    const paragraph = rendered
      ? DomUtils.getElementsByTagName("p", parseDocument(rendered))[0]
      : undefined;

    return {
      title: article.title,
      description: paragraph ? DomUtils.textContent(paragraph) : "",
      icon: "post",
      action: {
        type: ActionType.LINK,
        href: article.url,
      },
    } satisfies FeedItem;
  });
}

/** Both searches are public, so they are cached per query rather than per user. */
export function useItemSearch(query: string) {
  return useQuery({
    queryKey: keys.inventory(query),
    enabled: !!query,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => fetchItems(query, signal),
  });
}

export function useArticleSearch(query: string) {
  return useQuery({
    queryKey: keys.articles(query),
    enabled: !!query,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => fetchArticles(query, signal),
  });
}
