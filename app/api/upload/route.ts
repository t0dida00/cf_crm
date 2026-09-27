import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

/**
 * Forwards an image to the backend (`POST /platforms/me/uploads`), which
 * stores it in the business's own storage or the shared one and answers
 * `{ url }`. The generic proxy only carries JSON, so the raw file goes
 * through here.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/platforms/me/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/octet-stream",
        "X-Filename": req.headers.get("x-filename") || "upload",
        Authorization: `Bearer ${accessToken}`,
      },
      body: await req.arrayBuffer(),
      cache: "no-store",
      signal: req.signal,
    });
  } catch (err) {
    if (req.signal.aborted) return new NextResponse(null, { status: 499 }); // client went away
    throw err;
  }

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
