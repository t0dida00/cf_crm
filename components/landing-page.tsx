import Link from "next/link";
import Image from "next/image";
import { Lora } from "next/font/google";
import {
  ArrowRight,
  BellRinging,
  ChartLineUp,
  CheckCircle,
  Coffee,
  Envelope,
  ForkKnife,
  QrCode,
  SquaresFour,
  Table,
} from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { LEXICON } from "@/lib/lexicon";
import { ContactForm } from "@/components/contact-form";
import { MarketingShell, MarketingFooter } from "@/components/marketing-theme";

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
});

const DEMO_CREDENTIALS = {
  email: "admin@example.com",
  password: "password123",
};

const AUTHOR = {
  name: "Khoa Dinh",
  email: "khoadinh.work@gmail.com",
};

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#products", label: "Menu" },
  { href: "#demo", label: "Demo" },
  { href: "#contact", label: "Contact" },
];

const FEATURES = [
  {
    icon: QrCode,
    title: "QR ordering, zero app",
    description:
      "Guests scan the table code and order straight from their phone. No install, no account, no waiting for a server.",
  },
  {
    icon: BellRinging,
    title: "Real-time everywhere",
    description:
      "New orders land on the kitchen and floor screens instantly — no refreshing, no shouting across the pass.",
  },
  {
    icon: Table,
    title: "Tables & bookings in one view",
    description:
      "See what's occupied, what's free, and what's booked tonight, updated live as guests come and go.",
  },
  {
    icon: ChartLineUp,
    title: "A dashboard that means something",
    description:
      "Revenue, top dishes, and busy hours — the numbers you'd otherwise have to guess at closing time.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Set up your workspace",
    description: "Add your business, pick restaurant or café, and you're ready — no onboarding call needed.",
  },
  {
    step: "02",
    title: "Build your menu & tables",
    description: "Add products, group them by category, and generate a QR code for every table in seconds.",
  },
  {
    step: "03",
    title: "Take orders in real time",
    description: "Guests order from their phones, staff track orders live, and the kitchen never misses a ticket.",
  },
];

export function LandingPage() {
  const restaurant = LEXICON.restaurant;
  const cafe = LEXICON.cafe;

  return (
    <MarketingShell fontVariable={lora.variable}>
      <header className="border-b" style={{ borderColor: "var(--landing-border)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <Image src="/icons/bell_master.png" alt="" fill sizes="28px" className="object-cover" />
            </span>
            <span className={`${lora.className} text-base font-semibold`}>Tably</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--landing-muted)" }}
              >
                {label}
              </a>
            ))}
          </nav>
          <Button
            asChild
            className="rounded-full border-0 text-white hover:opacity-90"
            style={{ backgroundColor: "var(--landing-ink)" }}
          >
            <Link href="/login">
              Open the floor
              <ArrowRight size={16} weight="bold" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
        <p
          className="text-xs font-semibold tracking-[0.25em] uppercase"
          style={{ color: "var(--landing-accent)" }}
        >
          Service, kept in order
        </p>
        <h1 className={`${lora.className} mx-auto mt-5 max-w-3xl text-4xl font-semibold text-balance sm:text-5xl`}>
          Run the floor like{" "}
          <em style={{ color: "var(--landing-accent)" }}>service</em>{" "}
          ran itself.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty" style={{ color: "var(--landing-muted)" }}>
          Tably keeps every table accounted for and every ticket in line — QR ordering, live
          kitchen updates, and bookings, all in one calm room.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="rounded-full border-0 text-base text-white hover:opacity-90"
            style={{ backgroundColor: "var(--landing-accent)" }}
          >
            <Link href="/login">Get started</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-0 text-base"
            style={{ backgroundColor: "var(--landing-card)", color: "var(--landing-ink)" }}
          >
            <Link href="#products">See the menu builder</Link>
          </Button>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <Image
            src="/landing/hero.svg"
            alt="A guest scans a table QR code to order; the order appears live on the kitchen's screen"
            width={960}
            height={480}
            className="h-auto w-full"
            priority
          />
        </div>
      </section>

      <section id="demo" className="border-t py-14" style={{ borderColor: "var(--landing-border)" }}>
        <div className="mx-auto max-w-3xl px-6">
          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-card)" }}
          >
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: "var(--landing-accent)" }}
            >
              Demo instructions
            </p>
            <h2 className={`${lora.className} mt-3 text-2xl font-semibold text-balance sm:text-3xl`}>
              This is a live demo app
            </h2>
            <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
              Tably is a portfolio project — feel free to explore the admin dashboard with a
              read/write demo account. Sign in with the credentials below to see the tables,
              menu builder, live orders, and reporting in action.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--landing-border)" }}>
                <p
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: "var(--landing-muted)" }}
                >
                  Email
                </p>
                <p className="mt-1 font-mono text-sm">{DEMO_CREDENTIALS.email}</p>
              </div>
              <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--landing-border)" }}>
                <p
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: "var(--landing-muted)" }}
                >
                  Password
                </p>
                <p className="mt-1 font-mono text-sm">{DEMO_CREDENTIALS.password}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full border-0 text-base text-white hover:opacity-90"
                style={{ backgroundColor: "var(--landing-accent)" }}
              >
                <Link href="/login">
                  Sign in to the demo
                  <ArrowRight size={16} weight="bold" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-0 text-base"
                style={{ backgroundColor: "var(--landing-bg-alt)", color: "var(--landing-ink)" }}
              >
                <Link href="/instruction">See what each role can do</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t py-14"
        style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-bg-alt)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: "var(--landing-accent)" }}
            >
              Everything the floor needs
            </p>
            <h2 className={`${lora.className} mt-3 text-3xl font-semibold text-balance`}>
              One connected system
            </h2>
            <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
              From the QR scan to the closing report, it&apos;s all in one place.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border p-7"
                style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-card)" }}
              >
                <span
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--landing-bg-alt)", color: "var(--landing-accent)" }}
                >
                  <Icon size={20} weight="bold" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-pretty" style={{ color: "var(--landing-muted)" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: "var(--landing-accent)" }}
            >
              Menu builder
            </p>
            <h2 className={`${lora.className} mt-3 text-3xl font-semibold text-balance`}>
              Build a menu guests actually enjoy
            </h2>
            <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
              Group products by category, set prices and descriptions, and publish updates
              instantly to every table.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[
              { icon: ForkKnife, domain: restaurant },
              { icon: Coffee, domain: cafe },
            ].map(({ icon: Icon, domain }) => (
              <div
                key={domain.label}
                className="rounded-2xl border p-7"
                style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-card)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-9 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: "var(--landing-ink)" }}
                  >
                    <Icon size={18} weight="bold" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{domain.label}</h3>
                    <p className="text-xs" style={{ color: "var(--landing-muted)" }}>
                      {domain.blurb}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  {domain.categories.map((category) => (
                    <div key={category.name}>
                      <p
                        className="text-xs font-semibold tracking-wide uppercase"
                        style={{ color: "var(--landing-muted)" }}
                      >
                        {category.name}
                      </p>
                      <ul className="mt-2.5 space-y-2.5">
                        {category.dishes.map(([name, price, note]) => (
                          <li
                            key={name}
                            className="flex items-start justify-between gap-4 border-t pt-2.5 first:border-t-0 first:pt-0"
                            style={{ borderColor: "var(--landing-border)" }}
                          >
                            <div>
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-xs text-pretty" style={{ color: "var(--landing-muted)" }}>
                                {note}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold">
                              {"€" + price.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-t py-14"
        style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-bg-alt)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: "var(--landing-accent)" }}
            >
              How it works
            </p>
            <h2 className={`${lora.className} mt-3 text-3xl font-semibold text-balance`}>
              Three steps to a calm service
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step}>
                <span className={`${lora.className} text-2xl font-semibold`} style={{ color: "var(--landing-accent)" }}>
                  {step}
                </span>
                <h3 className="mt-2 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-pretty" style={{ color: "var(--landing-muted)" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className={`${lora.className} text-3xl font-semibold text-balance`}>
            Your next service, already seated.
          </h2>
          <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
            Create your account and build your first menu in minutes.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full border-0 text-base text-white hover:opacity-90"
              style={{ backgroundColor: "var(--landing-accent)" }}
            >
              <Link href="/login">
                Get started
                <ArrowRight size={16} weight="bold" />
              </Link>
            </Button>
          </div>
          <ul
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 text-left text-sm sm:mx-auto sm:w-fit"
            style={{ color: "var(--landing-muted)" }}
          >
            {["No credit card required", "Works on any phone, no app install", "Free to try"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle size={16} weight="fill" style={{ color: "var(--landing-accent)" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="border-t py-14" style={{ borderColor: "var(--landing-border)" }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: "var(--landing-accent)" }}
            >
              Contact
            </p>
            <h2 className={`${lora.className} mt-3 text-3xl font-semibold text-balance`}>Get in touch</h2>
            <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
              Questions, feedback, or want to talk about the project? Send a message and
              I&apos;ll get back to you.
            </p>
          </div>

          <div
            className="mt-8 overflow-hidden rounded-2xl border shadow-sm lg:grid lg:grid-cols-5"
            style={{ borderColor: "var(--landing-border)" }}
          >
            <div
              className="relative flex flex-col justify-between gap-8 overflow-hidden p-7 text-white sm:p-8 lg:col-span-2"
              style={{ backgroundColor: "var(--landing-ink)" }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative">
                <span
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "var(--landing-accent)" }}
                >
                  <Envelope size={20} weight="bold" />
                </span>
                <p className={`${lora.className} mt-5 text-xl font-semibold text-balance`}>
                  Let&apos;s talk about your project
                </p>
                <p className="mt-2 text-sm text-white/70 text-pretty">
                  Whether it&apos;s a question about Tably or a project you have in mind,
                  I usually reply within a day.
                </p>
              </div>
              <div className="relative">
                <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">Built by</p>
                <p className="mt-1.5 text-lg font-semibold">{AUTHOR.name}</p>
                <a
                  href={`mailto:${AUTHOR.email}`}
                  className="mt-2 inline-flex items-center gap-2 text-sm text-white/90 hover:text-white hover:underline"
                >
                  <Envelope size={15} weight="bold" />
                  {AUTHOR.email}
                </a>
              </div>
            </div>

            <div className="p-7 sm:p-8 lg:col-span-3" style={{ backgroundColor: "var(--landing-card)" }}>
              <ContactForm
                buttonClassName="w-full rounded-full border-0 text-white hover:opacity-90 sm:w-auto"
                buttonStyle={{ backgroundColor: "var(--landing-accent)" }}
              />
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingShell>
  );
}
