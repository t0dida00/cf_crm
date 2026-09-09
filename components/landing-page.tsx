import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BellRinging,
  ChartLineUp,
  CheckCircle,
  Coffee,
  ForkKnife,
  QrCode,
  SquaresFour,
  Table,
} from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LEXICON } from "@/lib/lexicon";

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
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white">
              <SquaresFour size={15} weight="bold" />
            </span>
            <span className="text-sm font-bold">CRM Restaurant</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                Get started
                <ArrowRight size={16} weight="bold" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
        <Badge variant="secondary" className="mx-auto bg-brand-50 text-brand-700">
          Built for restaurants &amp; cafés
        </Badge>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold text-balance sm:text-5xl">
          Run your floor, not your spreadsheets
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
          QR ordering, live tables, and a kitchen that always knows what&apos;s next —
          one workspace for your whole team.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 text-base">
            <Link href="/login">
              Get started
              <ArrowRight size={16} weight="bold" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 text-base">
            <Link href="#products">See the menu builder</Link>
          </Button>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
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

      <section className="border-t bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold text-balance">Everything the floor needs</h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              From the QR scan to the closing report, it&apos;s all one connected system.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-7">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={20} weight="bold" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold text-balance">Build a menu guests actually enjoy</h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Group products by category, set prices and descriptions, and publish updates
              instantly to every table.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[
              { icon: ForkKnife, domain: restaurant },
              { icon: Coffee, domain: cafe },
            ].map(({ icon: Icon, domain }) => (
              <Card key={domain.label} className="p-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                    <Icon size={18} weight="bold" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{domain.label}</h3>
                    <p className="text-xs text-muted-foreground">{domain.blurb}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  {domain.categories.map((category) => (
                    <div key={category.name}>
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {category.name}
                      </p>
                      <ul className="mt-2.5 space-y-2.5">
                        {category.dishes.map(([name, price, note]) => (
                          <li key={name} className="flex items-start justify-between gap-4 border-t pt-2.5 first:border-t-0 first:pt-0">
                            <div>
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground text-pretty">{note}</p>
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold text-balance">Up and running in three steps</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step}>
                <span className="text-sm font-bold text-brand-500">{step}</span>
                <h3 className="mt-2 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold text-balance">Ready to set up your workspace?</h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Create your account and build your first menu in minutes.
          </p>
          <div className="mt-7 flex items-center justify-center">
            <Button asChild size="lg" className="h-11 text-base">
              <Link href="/login">
                Get started
                <ArrowRight size={16} weight="bold" />
              </Link>
            </Button>
          </div>
          <ul className="mx-auto mt-8 flex max-w-md flex-col gap-2 text-left text-sm text-muted-foreground sm:mx-auto sm:w-fit">
            {["No credit card required", "Works on any phone, no app install", "Free to try"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle size={16} weight="fill" className="text-brand-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CRM Restaurant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
