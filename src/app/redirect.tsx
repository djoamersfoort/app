import { Redirect } from "expo-router";

/**
 * Catches the OAuth redirect (`djo://redirect`).
 *
 * `WebBrowser.maybeCompleteAuthSession()` normally closes the browser before
 * this ever renders, but without a matching route a slow dismissal would land
 * the user on the not-found screen.
 */
export default function AuthRedirect() {
  return <Redirect href={"/"} />;
}
