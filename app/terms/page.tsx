import Link from "next/link";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_OWNER } from "@/lib/siteOwner";

export const metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro="These terms cover using Tably: the owner and staff apps, the guest menu reached from a table's QR code, and this website. By using Tably you agree to them."
    >
      <section>
        <h2>What Tably is</h2>
        <p>
          Tably is a portfolio project by {SITE_OWNER.name}. It is free to use and offered as it is, to
          show how restaurant and café ordering can work. It is not a paid service and comes with no
          service-level commitment.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <ul>
          <li>Owners create an account with their full name, email and a password, and keep the details accurate.</li>
          <li>Owners create the staff accounts for their business and are responsible for who gets one.</li>
          <li>Keep your password to yourself. Tell us straight away if you think someone else has used your account.</li>
          <li>We can suspend or close an account that breaks these terms.</li>
        </ul>
      </section>

      <section>
        <h2>The demo account</h2>
        <p>
          The demo account is shared: anyone can sign in and change its menu, tables, orders and
          bookings. Don&apos;t enter real personal details there. Its data can be reset at any time.
        </p>
      </section>

      <section>
        <h2>Your business data</h2>
        <p>
          The menu, tables, orders, bookings, images and settings you add stay yours. Tably only uses
          them to run the service for you. If you connect your own database, real-time (Pusher) app or
          image storage, those services&apos; own terms apply to them, and you&apos;re responsible for
          your accounts there.
        </p>
      </section>

      <section>
        <h2>Guests ordering at a table</h2>
        <p>
          Guests order through the business, not through Tably. The business sets its menu, prices and
          taxes, and handles service and payment. Questions about an order go to the restaurant or
          café.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Don&apos;t use Tably for anything unlawful.</li>
          <li>Don&apos;t try to reach another business&apos;s data, break the service or overload it.</li>
          <li>Only upload images and text you have the right to use.</li>
        </ul>
      </section>

      <section>
        <h2>Availability and liability</h2>
        <p>
          Tably can change, pause or stop at any time. It is provided without warranties, and as far as
          the law allows, {SITE_OWNER.name} isn&apos;t liable for lost data, lost orders or lost income
          from using it. Keep your own records of anything your business depends on.
        </p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>
          When these terms change, the date at the top changes too. See also the{" "}
          <Link href="/privacy">privacy policy</Link> and <Link href="/cookies">cookie policy</Link>.
          Questions: <a href={`mailto:${SITE_OWNER.email}`}>{SITE_OWNER.email}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
