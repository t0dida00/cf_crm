import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { SAVED_MESSAGE, useAsyncAction } from "./use-async-action";

beforeEach(() => vi.clearAllMocks());

describe("useAsyncAction", () => {
  test("shows the success toast when a save succeeds", async () => {
    const { result } = renderHook(() => useAsyncAction());
    let ok = false;
    await act(async () => {
      ok = await result.current.run("save", async () => {}, undefined, SAVED_MESSAGE);
    });
    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Saved successfully");
  });

  test("no success toast unless asked, and an error toast on failure", async () => {
    const { result } = renderHook(() => useAsyncAction());
    await act(async () => {
      await result.current.run("plain", async () => {});
    });
    expect(toast.success).not.toHaveBeenCalled();

    let ok = true;
    await act(async () => {
      ok = await result.current.run("save", async () => {
        throw new Error("Phone must contain only digits");
      }, undefined, SAVED_MESSAGE);
    });
    expect(ok).toBe(false);
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Phone must contain only digits");
  });
});
