export interface ApiLocation {
  configuredUrl?: string;
  development: boolean;
  platform: string;
  hostUri?: string | null;
  webHostname?: string;
}

function privateHost(host: string): boolean {
  if (["localhost", "127.0.0.1", "[::1]"].includes(host)) return true;
  const parts = host.split(".").map(Number);
  return (
    parts.length === 4 &&
    parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) &&
    (parts[0] === 10 ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31))
  );
}

// Only development discovers the API on the Metro computer. Never guess a public
// API from an Expo tunnel or from the hostname of a published website.
export function resolveApiUrl(location: ApiLocation): string {
  const configured = location.configuredUrl?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/"
      )
        return "";
      return url.origin;
    } catch {
      return "";
    }
  }
  if (!location.development) return "";
  try {
    const source =
      location.platform === "web" ? location.webHostname : location.hostUri;
    if (!source) return "";
    const url = new URL(
      /^[a-z]+:\/\//i.test(source) ? source : "http://" + source,
    );
    let host = url.hostname;
    if (!privateHost(host)) return "";
    if (
      location.platform === "android" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(host)
    )
      host = "10.0.2.2";
    return "http://" + host + ":5000";
  } catch {
    return "";
  }
}
