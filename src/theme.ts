/**
 * The handful of token values that native code needs as plain colours.
 *
 * Everything else styles through Tailwind utilities against `global.css`; the
 * native tab bar and the React Navigation theme cannot read CSS variables, so
 * those two mirror the same values here. Keep in sync with `src/global.css`.
 */
export const theme = {
  light: {
    primary: "#202088",
    background: "#ffffff",
    card: "#ffffff",
    foreground: "#0a0a0a",
    mutedForeground: "#737373",
    border: "#e5e5e5",
    // Android press feedback. The native tab bar defaults to a fully opaque
    // primary, which flashes hard on every tab switch; Material's ripple is a
    // low-alpha tint instead.
    ripple: "rgba(32, 32, 136, 0.12)",
  },
  dark: {
    primary: "#8d8df5",
    background: "#0a0a0a",
    card: "#171717",
    foreground: "#fafafa",
    mutedForeground: "#a1a1a1",
    border: "#2e2e2e",
    ripple: "rgba(141, 141, 245, 0.12)",
  },
} as const;
