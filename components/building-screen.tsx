"use client";

import { useEffect } from "react";
import {
  Buildings,
  CalendarCheck,
  CheckCircle,
  Folders,
  ListBullets,
  Receipt,
  SquaresFour,
} from "@phosphor-icons/react";
import { LEXICON } from "@/lib/lexicon";
import type { Domain } from "@/lib/types";

const DURATION = 3000;

export function BuildingScreen({
  name,
  domain,
  onDone,
}: {
  name: string;
  domain: Domain;
  onDone: () => void;
}) {
  const lex = LEXICON[domain];

  useEffect(() => {
    const timer = setTimeout(onDone, DURATION);
    return () => clearTimeout(timer);
  }, [onDone]);

  const cards = [
    { Icon: Buildings, title: "Workspace", sub: name },
    { Icon: SquaresFour, title: "Tables", sub: "Ready to add" },
    { Icon: Folders, title: "Categories", sub: "Ready to add" },
    { Icon: ListBullets, title: "Menu", sub: "Ready to add" },
    { Icon: Receipt, title: "Orders", sub: "History imported" },
    { Icon: CalendarCheck, title: "Bookings", sub: "Calendar synced" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl text-center">
        <div style={{ animation: "fade-up 500ms ease both" }}>
          <p className="mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground">
            SETTING UP
          </p>
          <h1 className="text-3xl font-bold">Welcome, {name}</h1>
          <p className="mt-2 mb-10 text-sm text-muted-foreground">
            Assembling your {lex.label.toLowerCase()} workspace.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-left">
          {cards.map(({ Icon, title, sub }, i) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-5 opacity-0"
              style={{
                animation: `fly-in 620ms cubic-bezier(.2,.8,.3,1) ${200 + i * 280}ms both`,
              }}
            >
              <div className="flex items-center justify-between">
                <Icon size={20} weight="bold" className="text-brand-500" />
                <CheckCircle
                  size={18}
                  weight="fill"
                  className="text-brand-500 opacity-0"
                  style={{ animation: `tick-in 320ms ease ${620 + i * 280}ms both` }}
                />
              </div>
              <p className="mt-3.5 text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 h-[3px] w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full w-0 bg-brand-500"
            style={{ animation: `grow-bar ${DURATION}ms linear both` }}
          />
        </div>
      </div>
    </div>
  );
}
