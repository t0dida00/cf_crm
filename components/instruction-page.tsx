import Link from "next/link";
import Image from "next/image";
import { Lora } from "next/font/google";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarCheck,
  ChartBar,
  ClockCounterClockwise,
  Download,
  Flag,
  ForkKnife,
  Gear,
  ListChecks,
  QrCode,
  Receipt,
  ShoppingCart,
  SquaresFour,
  UserPlus,
  Users,
} from "@phosphor-icons/react/ssr";
import { MarketingShell, MarketingFooter } from "@/components/marketing-theme";

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
});

const ROLES = [
  {
    id: "client",
    label: "Client",
    eyebrow: "No login required",
    title: "The guest ordering from their table",
    description:
      "Guests reach Tably by scanning the QR code on their table — no app install, no account.",
    features: [
      {
        icon: QrCode,
        title: "Scan & browse",
        description: "Scan the table's QR code to open the menu, grouped by category, right in the browser.",
      },
      {
        icon: ShoppingCart,
        title: "Build an order",
        description: "Add items to a cart, adjust quantities, and leave a note for the kitchen on any item.",
      },
      {
        icon: Bell,
        title: "Call staff or checkout",
        description: "Tap \"Call staff\" or \"Checkout\" to ping the floor instantly — no waving to get attention.",
      },
      {
        icon: ClockCounterClockwise,
        title: "Order history",
        description: "Review every order placed at the table this visit, with line items and totals.",
      },
    ],
  },
  {
    id: "staff",
    label: "Staff",
    eyebrow: "Sign in required",
    title: "The floor and kitchen team",
    description: "Staff sign in to a shared dashboard that tracks every table and ticket in real time.",
    features: [
      {
        icon: Receipt,
        title: "Live orders",
        description: "New orders land on the board instantly, with a notification the moment a guest checks out.",
      },
      {
        icon: SquaresFour,
        title: "Table status",
        description: "See every table's state — free, seated, booked, or finished — and print the bill at checkout.",
      },
      {
        icon: CalendarCheck,
        title: "Bookings",
        description: "View upcoming reservations alongside live table activity.",
      },
      {
        icon: ForkKnife,
        title: "Menu reference",
        description: "Look up dish details while serving, plus a closed-orders history for past service.",
      },
      {
        icon: Bell,
        title: "Guest requests",
        description: "A bell icon surfaces pending \"call staff\" and \"checkout\" requests from guests, ready to resolve.",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    eyebrow: "Owner access",
    title: "The workspace owner",
    description: "Admins configure the workspace and get the full picture across every table and shift.",
    features: [
      {
        icon: ChartBar,
        title: "Dashboard",
        description: "Track revenue, top dishes, and busy hours over any period.",
      },
      {
        icon: SquaresFour,
        title: "Tables & categories",
        description: "Set up the floor plan and organize the menu into categories.",
      },
      {
        icon: ForkKnife,
        title: "Menu management",
        description: "Add, edit, and price every dish guests can order.",
      },
      {
        icon: Receipt,
        title: "Orders & bookings",
        description: "Browse, filter, and export order history, and manage upcoming reservations.",
      },
      {
        icon: Users,
        title: "Staff accounts",
        description: "Add staff members or disable their access when needed.",
      },
      {
        icon: QrCode,
        title: "Table QR codes",
        description: "Generate the QR code for every table — the link guests scan to reach the menu.",
      },
      {
        icon: Gear,
        title: "Settings",
        description: "Configure the workspace's tax rate and currency.",
      },
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    icon: UserPlus,
    title: "Create an account",
    description: "Sign up and set up your workspace as the admin.",
  },
  {
    icon: SquaresFour,
    title: "Create a table",
    description: "Add each table in your venue from the Tables panel.",
  },
  {
    icon: QrCode,
    title: "QR generates automatically",
    description: "Every table gets its own QR code the moment it's created — nothing else to set up.",
  },
  {
    icon: Download,
    title: "Download & place the QR",
    description: "Download the code and stick it on the matching table for guests to scan.",
  },
  {
    icon: ForkKnife,
    title: "Guests scan & order",
    description: "Scanning opens the menu — guests browse and place their order straight from their phone.",
  },
  {
    icon: Receipt,
    title: "Staff & admin see the order",
    description: "The order lands on the live board instantly, tied to its table.",
  },
  {
    icon: ListChecks,
    title: "Order moves through status",
    description: "Staff track it from New → Preparing → Served → Paid as service progresses.",
  },
];

export function InstructionPage() {
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
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: "var(--landing-muted)" }}
          >
            <ArrowLeft size={15} weight="bold" />
            Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
        <span
          className="mx-auto flex size-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--landing-card)", border: "1px solid var(--landing-border)" }}
        >
          <BookOpen size={20} weight="bold" style={{ color: "var(--landing-accent)" }} />
        </span>
        <p
          className="mt-5 text-xs font-semibold tracking-[0.25em] uppercase"
          style={{ color: "var(--landing-accent)" }}
        >
          How Tably works
        </p>
        <h1 className={`${lora.className} mx-auto mt-4 max-w-2xl text-4xl font-semibold text-balance sm:text-5xl`}>
          One app, three roles
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty" style={{ color: "var(--landing-muted)" }}>
          Every table interaction in Tably flows through one of three views. Here&apos;s what each
          one can do.
        </p>
      </section>

      {ROLES.map((role, index) => (
        <section
          key={role.id}
          id={role.id}
          className="border-t py-14"
          style={{
            borderColor: "var(--landing-border)",
            backgroundColor: index % 2 === 1 ? "var(--landing-bg-alt)" : undefined,
          }}
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
                style={{ backgroundColor: "var(--landing-card)", border: "1px solid var(--landing-border)", color: "var(--landing-accent)" }}
              >
                {role.eyebrow}
              </span>
              <h2 className={`${lora.className} mt-4 text-3xl font-semibold text-balance`}>
                {role.label} — {role.title}
              </h2>
              <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
                {role.description}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {role.features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border p-6"
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
      ))}

      <section
        className="border-t py-14"
        style={{
          borderColor: "var(--landing-border)",
          backgroundColor: ROLES.length % 2 === 1 ? "var(--landing-bg-alt)" : undefined,
        }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
              style={{ backgroundColor: "var(--landing-card)", border: "1px solid var(--landing-border)", color: "var(--landing-accent)" }}
            >
              <Flag size={13} weight="bold" />
              End to end
            </span>
            <h2 className={`${lora.className} mt-4 text-3xl font-semibold text-balance`}>
              From sign-up to a paid order
            </h2>
            <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
              Here&apos;s the full loop, start to finish.
            </p>
          </div>

          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map(({ icon: Icon, title, description }, i) => (
              <li
                key={title}
                className="relative rounded-2xl border p-6"
                style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-card)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--landing-bg-alt)", color: "var(--landing-accent)" }}
                  >
                    <Icon size={20} weight="bold" />
                  </span>
                  <span
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: "var(--landing-muted)" }}
                  >
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-pretty" style={{ color: "var(--landing-muted)" }}>
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <MarketingFooter />
    </MarketingShell>
  );
}
