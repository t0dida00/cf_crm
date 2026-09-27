import { Resend } from "resend";

/** Where the contact form and new-account notices go. */
export const ADMIN_EMAIL = "ddkhoa97@gmail.com";
/** Resend's shared test sender: it can only deliver to the Resend account's own address (ADMIN_EMAIL). */
const FROM = "Tably <onboarding@resend.dev>";

/**
 * Emails the admin (only) that someone created an owner account. Server-side
 * only. Never throws: a failed notice must not fail the signup.
 */
export async function notifyNewAccount({
  fullName,
  email,
  pendingApproval,
}: {
  fullName: string;
  email: string;
  pendingApproval: boolean;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured; no new-account email sent");
    return;
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: "New Account Registration",
      text: [
        "A new owner account was registered.",
        "",
        `Full name: ${fullName}`,
        `Email: ${email}`,
        "",
        pendingApproval
          ? `It's waiting for review. To approve it, set its account_approvals.status to "approved" in the central database.`
          : "It can sign in right away (REQUIRE_ACCOUNT_APPROVAL is off).",
      ].join("\n"),
    });
    if (error) console.error("Resend error (new account):", error);
  } catch (err) {
    console.error("Couldn't send the new-account email:", err);
  }
}
