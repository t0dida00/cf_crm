import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000";

// Deliberately no auth() call here — this proxy exists specifically to serve
// anonymous guests on /client with zero session, unlike app/api/proxy/[...path].
async function proxy(req: NextRequest, platformId: string, path: string[]) {
  const targetUrl = `${API_URL}/public/platforms/${platformId}/${path.join("/")}${req.nextUrl.search}`;
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const res = await fetch(targetUrl, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: hasBody ? await req.text() : undefined,
    cache: "no-store",
  });

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
