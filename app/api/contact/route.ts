import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { ADMIN_EMAIL } from "@/lib/notify";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 120, email: 254, message: 5000 };

/** One line, trimmed: a name goes into the email subject, so no line breaks. */
const oneLine = (v: string) => v.replace(/[\r\n\t]+/g, " ").trim();

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? oneLine(body.name) : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > LIMITS.email) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (name.length > LIMITS.name || message.length > LIMITS.message) {
    return NextResponse.json({ error: "That's too long." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return NextResponse.json({ error: "Contact form is not configured." }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Tably Contact Form <onboarding@resend.dev>",
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `New Tably contact from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
