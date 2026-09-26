export interface PusherFields {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
}

// Names Pusher uses for each value across its snippets: the App Keys box
// (app_id = "…"), .env files (PUSHER_APP_ID=…, NEXT_PUBLIC_PUSHER_KEY=…) and
// code (appId: "…").
const NAMES: Record<keyof PusherFields, string> = {
  appId: "app_?id",
  key: "key",
  secret: "secret",
  cluster: "cluster",
};

/**
 * Reads Pusher credentials from text copied out of the Pusher dashboard.
 * Returns only the fields it found, so a partial paste still fills what it can.
 */
export function parsePusherSnippet(text: string): Partial<PusherFields> {
  const found: Partial<PusherFields> = {};
  for (const [field, name] of Object.entries(NAMES) as [keyof PusherFields, string][]) {
    const pattern = new RegExp(
      `(?:^|[\\s,{;(])["']?(?:NEXT_PUBLIC_|VITE_|REACT_APP_)?(?:PUSHER_)?${name}["']?\\s*[:=]\\s*["']?([^"'\\s,;}]+)`,
      "im",
    );
    const value = text.match(pattern)?.[1];
    if (value) found[field] = value;
  }
  return found;
}
