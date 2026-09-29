import Link from "next/link";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata = { title: "Cookie policy" };

/* Keep in step with the code: Auth.js cookies (auth.ts), and the storage keys
 * in LoginCard, useSidebarCollapse, printReceipt and the admin/staff pages. */
const COOKIES = [
  ["authjs.session-token", "Keeps you signed in. Removed when you sign out or the session ends."],
  ["authjs.csrf-token", "Protects the sign-in form from forged requests."],
  ["authjs.callback-url", "Remembers the page to return to after signing in."],
];

const BROWSER_STORAGE = [
  ["tably:sign-in-as", "Whether you last signed in as Owner or Staff."],
  ["crm-sidebar-collapsed", "Whether you collapsed the app's sidebar."],
  ["tably:receipt-paper", "The receipt paper width you print on (80 or 58 mm)."],
  ["tably:building-seen", "That you've seen the workspace setup animation. Cleared when the tab closes."],
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      intro="Tably sets only the cookies it needs to sign you in. There are no advertising or tracking cookies, so there's nothing to accept or turn off."
    >
      <section>
        <h2>Cookies</h2>
        <p>
          Set by Auth.js when you sign in to the owner or staff app. Guests ordering from a table get
          none. On a secure (https) connection their names start with <code>__Secure-</code> or{" "}
          <code>__Host-</code>.
        </p>
        <StorageTable rows={COOKIES} caption="Cookies Tably sets" />
      </section>

      <section>
        <h2>Stored in your browser</h2>
        <p>
          A few preferences are kept in your browser&apos;s own storage. They never leave your device
          and aren&apos;t sent to us.
        </p>
        <StorageTable rows={BROWSER_STORAGE} caption="Preferences kept in browser storage" />
      </section>

      <section>
        <h2>Analytics</h2>
        <p>Vercel Analytics counts page views without cookies and without identifying you.</p>
      </section>

      <section>
        <h2>Your control</h2>
        <p>
          You can clear or block cookies and site data in your browser settings. Blocking the session
          cookie means you can&apos;t sign in. More on what we collect is in the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}

function StorageTable({ rows, caption }: { rows: string[][]; caption: string }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-(--landing-border) bg-(--landing-card)">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-(--landing-border)">
            <th scope="col" className="px-4 py-3 font-bold">Name</th>
            <th scope="col" className="px-4 py-3 font-bold">What it&apos;s for</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--landing-border)">
          {rows.map(([name, purpose]) => (
            <tr key={name}>
              <td className="px-4 py-3 align-top font-semibold whitespace-nowrap">{name}</td>
              <td className="px-4 py-3 align-top text-(--landing-muted)">{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
