import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import logging from "@/logging";

type NotificationsModule = typeof import("expo-notifications");

/**
 * Expo Go on Android dropped expo-notifications, so pulling the module in there
 * takes the whole app down at startup. Development builds and every iOS client
 * still ship the native module, so the require only has to be skipped for that
 * one combination — the try/catch covers any other client missing it.
 */
function load(): NotificationsModule | null {
  const expoGoAndroid =
    Platform.OS === "android" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (expoGoAndroid) {
    logging.log("PUSH", "Notifications unavailable: Expo Go on Android");
    return null;
  }

  try {
    return require("expo-notifications") as NotificationsModule;
  } catch (error) {
    logging.log(
      "PUSH",
      `Notifications unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/** The module, or null when this client cannot load it. */
const Notifications = load();

export default Notifications;
