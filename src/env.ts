export const CLIENT_ID =
  process.env.EXPO_PUBLIC_CLIENT_ID ||
  "QI0CNwnSLMJQbsZindMceAhtPR7lQlis0lTcCxGZ";
export const LEDEN_ADMIN =
  process.env.EXPO_PUBLIC_LEDEN_ADMIN || "https://leden.djoamersfoort.nl";
export const AANMELDEN =
  process.env.EXPO_PUBLIC_AANMELDEN || "https://aanmelden.djoamersfoort.nl";
export const CORVEE =
  process.env.EXPO_PUBLIC_CORVEE || "https://corvee.djoamersfoort.nl";
export const SCOPES: string[] = JSON.parse(
  process.env.EXPO_PUBLIC_SCOPES || "null",
) || [
  "openid",
  "user/basic",
  "user/names",
  "user/email",
  "media",
  "aanmelden",
  "corvee",
];
