import { useAtomValue } from "jotai";
import { CorveeProfile, stateAtom } from "../../stores/corvee";
import Listing from "./Listing";

export default function Selected() {
  const state = useAtomValue(stateAtom);

  if (!state) return <></>;

  return state.current.map((selected: CorveeProfile) => (
    <Listing key={selected.id} selected={selected} />
  ));
}
