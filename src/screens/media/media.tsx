import { useState } from "react";
import { StyleSheet } from "react-native";
import { Appbar, SegmentedButtons } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import Albums from "../../components/media/albums";
import Smoelen from "../../components/media/smoelen";

enum Page {
  ALBUMS = "albums",
  SMOELEN = "smoelen",
}

export default function MediaScreen() {
  const [page, setPage] = useState<Page>(Page.ALBUMS);
  const theme = useTheme();

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Media"} />
      </Appbar.Header>
      {page === Page.ALBUMS && <Albums />}
      {page === Page.SMOELEN && <Smoelen />}
      <SegmentedButtons
        style={{
          ...styles.pageSelector,
          backgroundColor: theme.colors.background,
        }}
        value={page}
        onValueChange={(page) => setPage(page as Page)}
        buttons={[
          {
            value: Page.ALBUMS,
            label: "Albums",
          },
          {
            value: Page.SMOELEN,
            label: "Smoelen ✨",
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  unauthenticated: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: 5,
    padding: 20,
    textAlign: "center",
  },
  pageSelector: {
    position: "absolute",
    bottom: 0,
    margin: 15,
    borderRadius: 50,
  },
});
