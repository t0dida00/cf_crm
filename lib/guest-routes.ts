const API_URL = process.env.API_URL || "http://localhost:3000";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The guest API's own routes (backend public.routes.ts), and nothing else. */
const GUEST_ROUTES: Record<string, string[]> = {
  menu: ["GET"],
  tables: ["GET"],
  settings: ["GET"],
  orders: ["GET", "POST"],
  requests: ["POST"],
};

/** The backend URL for a guest call, or null when it isn't one of the guest routes. */
export function guestTarget(platformId: string, path: string[], method: string, search = ""): string | null {
  if (!UUID.test(platformId) || path.length !== 1) return null;
  const [route] = path;
  if (!Object.hasOwn(GUEST_ROUTES, route) || !GUEST_ROUTES[route].includes(method)) return null;
  return `${API_URL}/public/platforms/${platformId}/${route}${search}`;
}
