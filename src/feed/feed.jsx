import { parse } from "rss-to-json";
import { useEffect, useState } from "react";
import Item from "./item";
import { Card, useTheme } from "react-native-paper";
import { NOTIFICATIONS_API_BASE } from "../env";
import { useAtom } from "jotai";
import { doneAtom, refreshingAtom } from "./refresh";

export default function Feed({ navigation, user }) {
  const [feed, setFeed] = useState([]);
  const [styleString, setStyleString] = useState("");
  const [refreshing] = useAtom(refreshingAtom);
  const [done, setDone] = useAtom(doneAtom);
  const theme = useTheme();

  function updateFeed() {
    setFeed([]);

    parse("https://djoamersfoort.nl/rss").then(({ items }) => {
      const newItems = items.map((item) => ({
        icon: "post",
        title: `${item.author} heeft een nieuw artikel gepost`,
        description: item.title,
        date: new Date(item.published),
        page: item.title,
        addStyles: false,
        source: {
          uri: item.link,
        },
      }));

      setFeed((feed) => [...feed, ...newItems].sort((a, b) => b.date - a.date));
      setDone(done + 1);
    });
    fetch(`${NOTIFICATIONS_API_BASE}/announcements`, {
      headers: {
        authorization: `Bearer ${user.tokens.id_token}`,
      },
    })
      .then((res) => res.json())
      .then((announcements) => {
        const items = announcements.map((announcement) => ({
          icon: "bullhorn",
          title: announcement.title,
          description: announcement.description,
          date: new Date(announcement.date),
          page: announcement.title,
          addStyles: true,
          source: {
            html: announcement.content,
          },
        }));
        setFeed((feed) => [...feed, ...items].sort((a, b) => b.date - a.date));
        setDone(done + 1);
      });
  }

  useEffect(() => {
    setStyleString(
      Object.entries(announcementStyle(theme))
        .map(
          ([e, style]) =>
            `${e} {${Object.entries(style)
              .map(([k, v]) => `${k}:${v}`)
              .join(";")}}`,
        )
        .join("; "),
    );
  }, [theme]);

  useEffect(() => {
    updateFeed();
  }, []);

  useEffect(() => {
    if (!refreshing) return;

    updateFeed();
  }, [refreshing]);

  return (
    <Card>
      <Card.Title title="Nieuws" />
      <Card.Content style={{ gap: 10 }}>
        {feed.map((item, i) => (
          <Item
            key={i}
            item={item}
            navigation={navigation}
            styles={styleString}
          />
        ))}
      </Card.Content>
    </Card>
  );
}

const announcementStyle = (theme) => ({
  body: {
    "background-color": theme.colors.background,
    color: theme.colors.text,
    "font-family": "sans-serif",
    "font-size": "1.5em",
    "line-height": "1.5em",
    margin: "20px",
  },
});
