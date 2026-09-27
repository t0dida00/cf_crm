import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: vi.fn().mockImplementation(() => ({ emails: { send } })) }));

import { POST } from "./route";

const post = (body: string) =>
  POST(new NextRequest("http://localhost:3001/api/contact", { method: "POST", body }));

beforeEach(() => {
  send.mockReset().mockResolvedValue({ error: null });
  process.env.RESEND_API_KEY = "re_test";
});

describe("contact route", () => {
  test("sends a valid message, with the name kept on one line in the subject", async () => {
    const res = await post(JSON.stringify({ name: "Ana\r\nBcc: x@y.z", email: "ana@example.com", message: "Hi" }));
    expect(res.status).toBe(200);
    expect(send.mock.calls[0][0].subject).toBe("New Tably contact from Ana Bcc: x@y.z");
    expect(send.mock.calls[0][0].replyTo).toBe("ana@example.com");
  });

  test.each([
    ["not JSON", "{oops"],
    ["missing fields", JSON.stringify({ name: "Ana" })],
    ["a bad email", JSON.stringify({ name: "Ana", email: "nope", message: "Hi" })],
    ["a huge message", JSON.stringify({ name: "Ana", email: "ana@example.com", message: "x".repeat(5001) })],
  ])("refuses %s with 400 and sends nothing", async (_label, body) => {
    expect((await post(body)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});
