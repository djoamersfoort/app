import { CorveeProfile, CorveeState } from "../../queries/corvee";
import Listing from "./Listing";

export default function Selected({ state }: { state: CorveeState }) {
  return state.current.map((selected: CorveeProfile) => (
    <Listing key={selected.id} selected={selected} />
  ));
}
