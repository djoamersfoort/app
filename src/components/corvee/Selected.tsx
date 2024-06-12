import { useAtom, useAtomValue } from "jotai";
import { getStatus, stateAtom } from "../../stores/corvee";
import { Button, Card } from "react-native-paper";
import { ScrollView, StyleSheet, View } from "react-native";
import { CORVEE } from "../../env";
import { useContext, useState } from "react";
import AuthContext, { Authed } from "../../auth";
import Listing from "./Listing";

export default function Selected() {
  const state = useAtomValue(stateAtom);

  if (!state) return <></>;

  return state.current.map((selected) => (
    <Listing key={selected.id} selected={selected} />
  ));
}
