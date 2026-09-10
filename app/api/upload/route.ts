import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const file = req.body ? await req.blob() : null;
  const contentType = req.headers.get("content-type") || "";
  const filename = req.headers.get("x-filename") || "upload";

  if (!file || !ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Please upload a PNG, JPEG, WEBP, or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });
  }

  const blob = await put(`dishes/${Date.now()}-${filename}`, file, {
    access: "public",
    contentType,
  });

  return NextResponse.json({ url: blob.url });
}
