import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useMutation } from "@tanstack/react-query";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { LEDEN_ADMIN } from "../env";
import { requestVoid } from "../api/client";
import { Authed, useAuth, useTokenProvider } from "../auth";
import logging from "../logging";

/**
 * Registers this device's push token once per session.
 *
 * Previously this was fired and forgotten from the auth state constructor, so a
 * failure surfaced as an unhandled rejection and a silently unregistered
 * device. As a mutation the failure is captured and logged instead.
 */
export function usePushRegistration() {
  const auth = useAuth();
  const token = useTokenProvider();
  const registeredFor = useRef<string | null>(null);

  const { mutate } = useMutation({
    mutationFn: async () => {
      if (!token) return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      if (!Device.isDevice) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      const { status } =
        existing === "granted"
          ? { status: existing }
          : await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;

      const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      await requestVoid(`${LEDEN_ADMIN}/notifications/token`, {
        method: "POST",
        auth: token,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: pushToken }),
      });
    },
    onError: (error) =>
      logging.log("PUSH", `Registration failed: ${error.message}`),
  });

  useEffect(() => {
    if (auth.authenticated !== Authed.AUTHENTICATED) return;
    // Re-register when the account changes, not on every re-render of the state.
    if (registeredFor.current === auth.user.sub) return;

    registeredFor.current = auth.user.sub;
    mutate();
  }, [auth, mutate]);
}
