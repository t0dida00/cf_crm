import { NextRequest, NextResponse } from "next/server";
import { guestTarget } from "@/lib/guestRoutes";

// Deliberately no auth() call here — this proxy exists specifically to serve
// anonymous guests on /client with zero session, unlike app/api/proxy/[...path].
async function proxy(req: NextRequest, platformId: string, path: string[]) {
  // Only the guest routes, so a crafted path (e.g. encoded "../") can't reach
  // the rest of the backend.
  const targetUrl = guestTarget(platformId, path, req.method, req.nextUrl.search);
  if (!targetUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
      // A cancelled browser request cancels the backend call too.
      signal: req.signal,
    });
  } catch (err) {
    if (req.signal.aborted) return new NextResponse(null, { status: 499 }); // client went away
    throw err;
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

type RouteParams = { params: Promise<{ platformId: string; path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { platformId, path } = await params;
  return proxy(req, platformId, path);
}
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { platformId, path } = await params;
  return proxy(req, platformId, path);
}
