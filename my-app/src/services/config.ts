// Public origin only: EXPO_PUBLIC_* values are bundled into the application.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "")
  .trim()
  .replace(/\/+$/, "");
export function imageUrl(value: string): string | undefined {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//") && API_URL)
    return API_URL + value;
  if (/^assets\//.test(value) && API_URL) return API_URL + "/" + value;
  return undefined;
}
