import { NativeTabs } from "expo-router/unstable-native-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Authed, useAuth } from "../../auth";

const { Trigger } = NativeTabs;
const { Icon, Label, VectorIcon } = Trigger;

/**
 * Native platform tab bar.
 *
 * Tabs cannot be added or removed at runtime, so the member-only tabs are
 * declared unconditionally and toggled with `hidden` instead. `hidden` also
 * blocks navigation to the route, so this still gates access.
 *
 * Icons pair an SF Symbol on iOS with the app's existing MaterialCommunityIcons
 * glyph on Android, which is what `src` falls back to on that platform.
 */
export default function TabsLayout() {
  const auth = useAuth();

  const authenticated = auth.authenticated === Authed.AUTHENTICATED;
  const tutor = authenticated && auth.user.account_type.includes("begeleider");

  return (
    <NativeTabs>
      <Trigger name={"index"}>
        <Icon
          sf={{ default: "house", selected: "house.fill" }}
          src={<VectorIcon family={MaterialCommunityIcons} name={"home"} />}
        />
        <Label>Home</Label>
      </Trigger>

      <Trigger name={"agenda"}>
        <Icon
          sf={"calendar"}
          src={<VectorIcon family={MaterialCommunityIcons} name={"calendar"} />}
        />
        <Label>Agenda</Label>
      </Trigger>

      <Trigger name={"corvee"} hidden={!tutor}>
        <Icon
          sf={"list.clipboard"}
          src={
            <VectorIcon
              family={MaterialCommunityIcons}
              name={"clipboard-list"}
            />
          }
        />
        <Label>Corvee</Label>
      </Trigger>

      <Trigger name={"media"} hidden={!authenticated}>
        <Icon
          sf={"play.rectangle"}
          src={<VectorIcon family={MaterialCommunityIcons} name={"video"} />}
        />
        <Label>Media</Label>
      </Trigger>

      <Trigger name={"settings"}>
        <Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          src={<VectorIcon family={MaterialCommunityIcons} name={"cog"} />}
        />
        <Label>Instellingen</Label>
      </Trigger>
    </NativeTabs>
  );
}
