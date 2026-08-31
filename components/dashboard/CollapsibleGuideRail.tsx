"use client";

import { useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuideItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  badge?: string;
  accent?: boolean;
};

export function CollapsibleGuideRail({
  heading = "How this works",
  subheading = "Tap a topic to expand.",
  items,
  className,
}: {
  heading?: string;
  subheading?: string;
  items: GuideItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={cn(
        "lg:sticky lg:top-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto brand-scroll",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
            {heading}
          </p>
          {subheading ? (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {subheading}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isOpen = !!open[item.id];
            return (
              <div
                key={item.id}
                className={cn(
                  "bento overflow-hidden",
                  item.accent &&
                    "bg-[color-mix(in_srgb,var(--brand)_6%,var(--surface))]"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2.5 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">
                    {item.title}
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-border/50 px-4 pb-3.5 pt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
