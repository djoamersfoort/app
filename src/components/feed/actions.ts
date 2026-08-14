import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ActionType, FeedItem } from "@/queries/feed";
import { encodeParam } from "@/routes";

/** Opens whatever a feed item points at: a browser, a route, or a document. */
export function useOpenFeedItem() {
  const router = useRouter();

  return async function open(item: FeedItem) {
    switch (item.action.type) {
      case ActionType.LINK:
        await WebBrowser.openBrowserAsync(item.action.href);
        return;
      case ActionType.VIEW:
        // Only the id: the announcement's HTML is read back from the feed cache.
        router.push({
          pathname: "/web",
          params: { id: item.action.id, title: item.title },
        });
        return;
      case ActionType.ITEM:
        router.push({
          pathname: "/item",
          params: { item: encodeParam(item.action.item), title: item.title },
        });
        return;
      case ActionType.EVENT:
        router.push({
          pathname: "/event",
          params: { event: encodeParam(item.action.event), title: item.title },
        });
    }
  };
}
