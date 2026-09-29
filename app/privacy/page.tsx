import Link from "next/link";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_OWNER } from "@/lib/siteOwner";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={`What Tably collects, why, and who else handles it. Tably is run by ${SITE_OWNER.name}, who you can reach at ${SITE_OWNER.email}.`}
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Owner accounts:</strong> full name, email and password. Passwords are stored only as
            a bcrypt hash, never as you typed them.
          </li>
          <li>
            <strong>Staff accounts:</strong> the name, email and password an owner sets for each staff
            member.
          </li>
          <li>
            <strong>Business data:</strong> menu, prices, tables, orders, bookings, settings, the logo and
            dish photos. Bookings hold the guest name and phone number staff enter.
          </li>
          <li>
            <strong>Guests at a table:</strong> no account and no personal details. Orders and requests
            such as &ldquo;call staff&rdquo; are tied to the table, not to a person.
          </li>
          <li>
            <strong>Messages:</strong> the name, email and message you send with a contact form.
          </li>
          <li>
            <strong>Usage:</strong> anonymous page-view counts from Vercel Analytics, which uses no
            cookies.
          </li>
        </ul>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To sign you in and run your business&apos;s tables, orders and bookings.</li>
          <li>To email the site owner about new sign-ups and contact messages, so they can reply.</li>
          <li>To see which pages are used and improve them.</li>
        </ul>
        <p>We don&apos;t sell your data or use it for advertising.</p>
      </section>

      <section>
        <h2>Who else handles it</h2>
        <ul>
          <li>Vercel hosts the website, its analytics and, unless you connect your own, image storage.</li>
          <li>Pusher delivers live updates, such as a new order reaching the staff screens.</li>
          <li>Resend delivers the sign-up and contact-form emails.</li>
          <li>
            If an owner connects their own database, Pusher app or image storage, that business&apos;s
            data is kept there instead.
          </li>
        </ul>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          Account and business data are kept while the account exists. Contact messages stay in the
          site owner&apos;s inbox. The shared demo account can be reset at any time.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          To see, correct or delete your data, or to close your account, email{" "}
          <a href={`mailto:${SITE_OWNER.email}`}>{SITE_OWNER.email}</a>. Owners can edit or remove
          their staff accounts in the Staff tab. For what&apos;s stored in your browser, see the{" "}
          <Link href="/cookies">cookie policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
