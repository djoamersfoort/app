import { Appbar } from "react-native-paper";
import Albums from "../../components/media/albums";

export default function MediaScreen() {
  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={"Media"} />
      </Appbar.Header>
      <Albums />
    </>
  );
}
