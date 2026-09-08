import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000";

// Unauthenticated by design — resolves a QR token to {platformId, tableName}
// before the guest's session/platform is known at all.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await fetch(`${API_URL}/public/tokens/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
