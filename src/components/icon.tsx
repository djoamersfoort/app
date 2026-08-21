import { styled } from "nativewind";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/**
 * The app's icon set, wired into NativeWind.
 *
 * Vector icons render as text, so `className` reaches the glyph colour
 * (`text-primary`, `text-muted-foreground`, …). Size stays an explicit prop
 * because the font needs a number, not a utility class.
 */
const Icon = styled(MaterialCommunityIcons, { className: "style" });

export default Icon;
