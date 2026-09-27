import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: vi.fn().mockImplementation(() => ({ emails: { send } })) }));

import { ADMIN_EMAIL, notifyNewAccount } from "./notify";

const originalKey = process.env.RESEND_API_KEY;
let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  send.mockReset().mockResolvedValue({ error: null });
  process.env.RESEND_API_KEY = "re_test";
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  process.env.RESEND_API_KEY = originalKey;
  consoleError.mockRestore();
});

describe("notifyNewAccount", () => {
  test("emails only the admin, titled New Account Registration, with the name and email", async () => {
    await notifyNewAccount({ fullName: "Ana Ruiz", email: "ana@example.com", pendingApproval: true });

    expect(send).toHaveBeenCalledTimes(1);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe(ADMIN_EMAIL);
    expect(mail.subject).toBe("New Account Registration");
    expect(mail.text).toContain("Full name: Ana Ruiz");
    expect(mail.text).toContain("Email: ana@example.com");
    expect(mail.text).toMatch(/waiting for review/);
  });

  test("says when the account can already sign in", async () => {
    await notifyNewAccount({ fullName: "Ana Ruiz", email: "ana@example.com", pendingApproval: false });
    expect(send.mock.calls[0][0].text).toMatch(/sign in right away/);
  });

  test("never throws: no key, a Resend error, or a network failure", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(notifyNewAccount({ fullName: "A B", email: "a@b.co", pendingApproval: true })).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();

    process.env.RESEND_API_KEY = "re_test";
    send.mockResolvedValueOnce({ error: { message: "bad" } });
    await expect(notifyNewAccount({ fullName: "A B", email: "a@b.co", pendingApproval: true })).resolves.toBeUndefined();
    send.mockRejectedValueOnce(new Error("offline"));
    await expect(notifyNewAccount({ fullName: "A B", email: "a@b.co", pendingApproval: true })).resolves.toBeUndefined();
  });
});
