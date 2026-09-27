import { describe, expect, test } from "vitest";
import { parsePusherSnippet } from "./pusherSnippet";

const ALL = { appId: "1234567", key: "abcdef0123456789", secret: "fedcba9876543210", cluster: "eu" };

describe("parsePusherSnippet", () => {
  test("reads the App Keys box Pusher copies", () => {
    const text = `app_id = "1234567"\nkey = "abcdef0123456789"\nsecret = "fedcba9876543210"\ncluster = "eu"`;
    expect(parsePusherSnippet(text)).toEqual(ALL);
  });

  test("reads .env style", () => {
    const text = `PUSHER_APP_ID=1234567\nPUSHER_KEY=abcdef0123456789\nPUSHER_SECRET=fedcba9876543210\nPUSHER_CLUSTER=eu`;
    expect(parsePusherSnippet(text)).toEqual(ALL);
  });

  test("reads the Node snippet", () => {
    const text = `const pusher = new Pusher({\n  appId: "1234567",\n  key: "abcdef0123456789",\n  secret: "fedcba9876543210",\n  cluster: "eu",\n  useTLS: true\n});`;
    expect(parsePusherSnippet(text)).toEqual(ALL);
  });

  test("returns only what it finds", () => {
    expect(parsePusherSnippet(`key = "abcdef0123456789"\ncluster = "ap1"`)).toEqual({ key: "abcdef0123456789", cluster: "ap1" });
    expect(parsePusherSnippet("nothing useful here")).toEqual({});
  });

  test("doesn't confuse other names ending in key", () => {
    expect(parsePusherSnippet(`api_key = "zzz"\nkey = "abcdef0123456789"`).key).toBe("abcdef0123456789");
  });
});
