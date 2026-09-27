import { describe, expect, test } from "vitest";
import { guestTarget } from "./guest-routes";

const ID = "3f6c1d2e-8a4b-4c5d-9e0f-1a2b3c4d5e6f";

describe("guestTarget", () => {
  test.each([
    [["menu"], "GET"],
    [["tables"], "GET"],
    [["settings"], "GET"],
    [["orders"], "GET"],
    [["orders"], "POST"],
    [["requests"], "POST"],
  ])("allows the guest route %j %s", (path, method) => {
    expect(guestTarget(ID, path, method, "?table=T1")).toMatch(new RegExp(`/public/platforms/${ID}/${path[0]}\\?table=T1$`));
  });

  test.each([
    ["not-a-uuid", ["menu"], "GET"],
    ["..%2F..%2Fauth", ["login"], "POST"],
    [ID, ["..", "..", "auth", "login"], "POST"],
    [ID, ["orders", "x"], "GET"],
    [ID, ["menu"], "POST"],
    [ID, ["requests"], "GET"],
    [ID, ["constructor"], "GET"],
    [ID, [], "GET"],
  ])("refuses %s %j %s", (platformId, path, method) => {
    expect(guestTarget(platformId, path, method)).toBeNull();
  });
});
