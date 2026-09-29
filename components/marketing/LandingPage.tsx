import Link from "next/link";
import { BellRinging, ChartLineUp, QrCode, Table } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { LEXICON } from "@/lib/lexicon";
import { SITE_OWNER } from "@/lib/siteOwner";
import { ContactForm } from "@/components/common/ContactForm";
import { DISPLAY, MarketingFooter, MarketingHeader, MarketingShell } from "./MarketingTheme";
import { TicketRail } from "./TicketRail";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#menu", label: "Menu" },
  { href: "#demo", label: "Demo" },
  { href: "#contact", label: "Contact" },
];

const FEATURES = [
  {
    icon: QrCode,
    title: "QR ordering, no app",
    description:
      "Guests scan the code on their table and order from their own phone. No install, no account, no waiting to catch someone's eye.",
  },
  {
    icon: BellRinging,
    title: "Live on every screen",
    description:
      "New orders reach the kitchen and floor screens the moment they're sent, without a refresh or anyone shouting across the pass.",
  },
  {
    icon: Table,
    title: "Tables and bookings together",
    description: "See which tables are seated, free or booked for tonight, updated as guests come and go.",
  },
  {
    icon: ChartLineUp,
    title: "The day's numbers",
    description: "Takings, best-selling dishes and busy hours, without adding it all up at closing time.",
  },
];

const STEPS = [
  {
    title: "Set up your business",
    description: "Add your details and choose restaurant or café. No onboarding call needed.",
  },
  {
    title: "Add your menu and tables",
    description: "Group dishes by category, set prices, and every table gets its own QR code.",
  },
  {
    title: "Take orders live",
    description: "Guests order from their phones and staff follow every ticket until it's paid.",
  },
];

// Solid cobalt primary and a bordered white secondary (light buttons need a border).
const PRIMARY = "h-11 border-0 bg-(--landing-accent) px-5 text-base text-white hover:bg-(--landing-accent-hover)";
const SECONDARY =
  "h-11 border border-(--landing-edge) bg-(--landing-card) px-5 text-base text-(--landing-ink) hover:bg-(--landing-bg-alt)";

export function LandingPage() {
  return (
    <MarketingShell>
      <MarketingHeader>
        <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="rounded-sm text-sm font-medium text-(--landing-muted) hover:text-(--landing-ink)">
              {label}
            </a>
          ))}
        </nav>
        <Button asChild className={`${PRIMARY} h-9 px-4 text-sm`}>
          <Link href="/login">Try the demo</Link>
        </Button>
      </MarketingHeader>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pt-20 lg:pb-16">
          <div>
            <h1 className={`${DISPLAY} text-[clamp(3.5rem,11vw,7.5rem)] text-balance`}>
              Every order, straight to the pass.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-pretty text-(--landing-muted)">
              Guests order from the QR code on their table. The ticket reaches your kitchen and floor
              screens the moment they send it, with tonight&apos;s bookings and the day&apos;s takings
              in the same place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className={PRIMARY}>
                <Link href="/login">Try the demo</Link>
              </Button>
              <Button asChild className={SECONDARY}>
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
          </div>
          <TicketRail />
        </section>

        <DemoAccess />

        <section id="features" aria-labelledby="features-title" className="bg-(--landing-bg-alt) py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="features-title" className={`${DISPLAY} text-5xl text-balance sm:text-6xl`}>
                From the scan to the closing count
              </h2>
              <p className="mt-4 max-w-md text-pretty text-(--landing-muted)">
                One system for the guest at the table, the team on the floor and you at the end of the night.
              </p>
            </div>
            <ul className="divide-y divide-(--landing-border) border-y border-(--landing-border)">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-5 py-6">
                  <Icon size={28} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-(--landing-accent)" />
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-1 max-w-prose text-pretty text-(--landing-muted)">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <MenuSample />

        <section aria-labelledby="steps-title" className="bg-(--landing-bg-alt) py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="steps-title" className={`${DISPLAY} max-w-2xl text-5xl text-balance sm:text-6xl`}>
              Ready for tonight in three steps
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {STEPS.map(({ title, description }, i) => (
                <li key={title} className="border-t-4 border-(--landing-accent) pt-4">
                  <span className={`${DISPLAY} text-5xl text-(--landing-accent)`} aria-hidden>
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-pretty text-(--landing-muted)">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="signup-title" className="bg-(--landing-ink) py-16 text-white sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="signup-title" className={`${DISPLAY} text-5xl text-balance sm:text-6xl`}>
                Your next service, already seated.
              </h2>
              <p className="mt-4 text-[#c9d2da]">Free to try, no credit card, works on any phone.</p>
            </div>
            <Button asChild className="h-11 shrink-0 border-0 bg-white px-5 text-base text-(--landing-ink) hover:bg-(--landing-bg)">
              <Link href="/signup">Create an account</Link>
            </Button>
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="contact-title" className={`${DISPLAY} text-5xl sm:text-6xl`}>
                Get in touch
              </h2>
              <p className="mt-4 max-w-md text-pretty text-(--landing-muted)">
                A question about Tably, feedback, or a project you have in mind? Send a message and
                I usually reply within a day.
              </p>
              <p className="mt-8 font-bold">{SITE_OWNER.name}</p>
              <a
                href={`mailto:${SITE_OWNER.email}`}
                className="rounded-sm text-(--landing-accent) underline underline-offset-4 hover:text-(--landing-accent-hover)"
              >
                {SITE_OWNER.email}
              </a>
            </div>
            <div className="rounded-md border border-(--landing-border) bg-(--landing-card) p-6 sm:p-8">
              <ContactForm buttonClassName={`${PRIMARY} w-full sm:w-auto`} />
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  );
}

function DemoAccess() {
  return (
    <section id="demo" aria-labelledby="demo-title" className="border-y border-(--landing-border) bg-(--landing-card)">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-8">
        <div>
          <h2 id="demo-title" className="text-xl font-bold">
            Want a demo?
          </h2>
          <p className="mt-1 max-w-xl text-pretty text-(--landing-muted)">
            Tably is a portfolio project. Get in touch and I&apos;ll share a demo account to explore
            the tables, menu, live orders and reports.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className={PRIMARY}>
            <Link href="#contact">Contact me</Link>
          </Button>
          <Link
            href="/instruction"
            className="rounded-sm text-sm font-medium text-(--landing-accent) underline underline-offset-4 hover:text-(--landing-accent-hover)"
          >
            See what each role can do
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Sample menus from the lexicon, set as a printed menu sheet. */
function MenuSample() {
  const menus = [LEXICON.restaurant, LEXICON.cafe];
  return (
    <section id="menu" aria-labelledby="menu-title" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="menu-title" className={`${DISPLAY} max-w-2xl text-5xl text-balance sm:text-6xl`}>
          Write the menu once, every table has it
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-(--landing-muted)">
          Group dishes by category, set prices and descriptions, and changes reach every table
          straight away.
        </p>

        <div className="mt-10 grid rounded-md border border-(--landing-border) bg-(--landing-card) md:grid-cols-2 md:divide-x md:divide-(--landing-border)">
          {menus.map((menu) => (
            <div key={menu.label} className="border-b border-(--landing-border) p-6 last:border-b-0 sm:p-8 md:border-b-0">
              <h3 className={`${DISPLAY} text-4xl`}>{menu.label}</h3>
              <p className="mt-1 text-sm text-(--landing-muted)">{menu.blurb}</p>
              {menu.categories.map((category) => (
                <div key={category.name} className="mt-7">
                  <h4 className="text-lg font-bold text-(--landing-accent)">{category.name}</h4>
                  <ul className="mt-3 space-y-3">
                    {category.dishes.map(([name, price, note]) => (
                      <li key={name}>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold">{name}</span>
                          <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.25em] border-b-2 border-dotted border-(--landing-border)" />
                          <span className="font-semibold tabular-nums">€{price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-pretty text-(--landing-muted)">{note}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
