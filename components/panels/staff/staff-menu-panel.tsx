"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/components/workspace-provider";
import { TONE_CLASSES } from "@/lib/tone";

export function StaffMenuPanel() {
  const { workspace, fmt } = useWorkspace();
  const { categories, dishes } = workspace;
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => dishes.filter((d) => !query || d.name.toLowerCase().includes(query.toLowerCase())),
    [dishes, query],
  );

  const groups = categories
    .map((category) => ({ category, items: filtered.filter((d) => d.catId === category.id) }))
    .filter((g) => g.items.length || !query);

  return (
    <>
      <div className="relative mb-4 w-80">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes"
          className="pl-9"
        />
      </div>

      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No dishes match.</p>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={categories.map((c) => c.id)}
          className="space-y-3"
        >
          {groups.map(({ category, items }) => (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="rounded-xl border bg-card px-0"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <span className="flex flex-1 items-center gap-3">
                  <span className="text-lg font-semibold">{category.name}</span>
                  <span className="flex-1" />
                  <span className="text-[13px] font-normal text-muted-foreground">
                    {items.length} {items.length === 1 ? "dish" : "dishes"}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="border-t pb-0">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 p-4">
                  {items.map((dish) => (
                    <div key={dish.id} className="rounded-xl border p-3.5">
                      <div className="flex items-start gap-2.5">
                        <span className="flex-1 text-[15px] font-semibold">{dish.name}</span>
                        <span className="text-[15px] font-bold">{fmt(dish.price)}</span>
                      </div>
                      <div className="mt-2.5">
                        <Badge className={TONE_CLASSES[dish.valid ? "green" : "gray"]}>
                          {dish.valid ? "Available" : "Off menu"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}
