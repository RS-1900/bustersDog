import Constants from "expo-constants";
import { Platform } from "react-native";
import { resolveApiUrl } from "./resolve-api-url";

// EXPO_PUBLIC_* is public. A release must configure an explicit API origin.
export const API_URL = resolveApiUrl({
  configuredUrl: process.env.EXPO_PUBLIC_API_URL,
  development: __DEV__,
  platform: Platform.OS,
  hostUri: Constants.expoConfig?.hostUri,
  webHostname:
    typeof window !== "undefined" ? window.location.hostname : undefined,
});
export function imageUrl(value: string): string | undefined {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//") && API_URL)
    return API_URL + value;
  if (/^assets\//.test(value) && API_URL) return API_URL + "/" + value;
  return undefined;
}
