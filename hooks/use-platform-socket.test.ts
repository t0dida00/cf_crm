import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

const instances: { key: string; subscribe: ReturnType<typeof vi.fn>; unsubscribe: ReturnType<typeof vi.fn> }[] = [];
vi.mock("pusher-js", () => ({
  default: vi.fn().mockImplementation((key: string) => {
    const client = {
      key,
      channel: vi.fn(() => undefined),
      subscribe: vi.fn((name: string) => ({ name, key })),
      unsubscribe: vi.fn(),
    };
    instances.push(client);
    return client;
  }),
}));

import { getPusherClient, usePlatformSocket } from "./use-platform-socket";

afterEach(cleanup);

describe("getPusherClient", () => {
  test("reuses one client per Pusher app", () => {
    const a = getPusherClient({ key: "key-a", cluster: "eu" });
    expect(getPusherClient({ key: "key-a", cluster: "eu" })).toBe(a);
    expect(getPusherClient({ key: "key-b", cluster: "eu" })).not.toBe(a);
  });

  test("returns null with no business app and no shared app configured", () => {
    expect(getPusherClient(null)).toBeNull();
  });
});

describe("usePlatformSocket", () => {
  test("subscribes on the business's own app and unsubscribes on unmount", () => {
    const { result, unmount } = renderHook(() => usePlatformSocket("p1", { key: "key-c", cluster: "ap1" }));
    const client = instances.find((c) => c.key === "key-c")!;
    expect(client.subscribe).toHaveBeenCalledWith("platform-p1");
    expect(result.current).toEqual({ name: "platform-p1", key: "key-c" });
    unmount();
    expect(client.unsubscribe).toHaveBeenCalledWith("platform-p1");
  });

  test("stays idle without a platform", () => {
    const { result } = renderHook(() => usePlatformSocket(null, { key: "key-d", cluster: "eu" }));
    expect(result.current).toBeNull();
  });
});
