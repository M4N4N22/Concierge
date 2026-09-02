"use client";

import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Layers,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StrategyCard = {
  id: string;
  title: string;
  blurb: string;
  status: "live" | "soon";
  kind: string;
  icon: typeof TrendingUp;
  href?: string;
  deskPrefill?: "buy" | "sell";
};

const STRATEGIES: StrategyCard[] = [
  {
    id: "accumulate-og",
    title: "Accumulate OG",
    blurb: "Deploy idle USDC into OG on the spot desk — agent-sized, you confirm.",
    status: "live",
    kind: "Spot",
    icon: TrendingUp,
    href: "/dashboard/trading/desk",
    deskPrefill: "buy",
  },
  {
    id: "trim-og",
    title: "Trim into USDC",
    blurb: "Reduce OG inventory toward stables when cash is thin vs inventory.",
    status: "live",
    kind: "Spot",
    icon: Shield,
    href: "/dashboard/trading/desk",
    deskPrefill: "sell",
  },
  {
    id: "hot-volatile",
    title: "Hot / volatile tokens",
    blurb: "Discovery board for moving names — still settles as spot when routed.",
    status: "soon",
    kind: "Discovery",
    icon: Flame,
  },
  {
    id: "bull-call",
    title: "Bull call spread",
    blurb: "Defined-risk upside via calls. Needs an options venue on 0G.",
    status: "soon",
    kind: "Options",
    icon: Layers,
  },
  {
    id: "bull-put",
    title: "Bull put spread",
    blurb: "Credit put structure for mild bullish / range. Options venue required.",
    status: "soon",
    kind: "Options",
    icon: Layers,
  },
];

export function StrategiesWorkspace() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold    text-[var(--brand)]">
          Trading & Finance
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold   sm:text-3xl">
              Strategies
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Structured plays in the Sensibull sense — spot templates you can
              run on the desk today; options spreads when a venue exists.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard/trading/desk">
              Open desk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {STRATEGIES.map((s) => {
          const Icon = s.icon;
          const inner = (
            <div
              className={cn(
                "bento flex h-full flex-col p-5 transition-colors",
                s.status === "live" &&
                  "hover:bg-[color-mix(in_srgb,var(--brand)_6%,var(--surface))]",
                s.status === "soon" && "opacity-80"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
                  <Icon className="h-4 w-4 text-[var(--brand)]" />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold    ",
                    s.status === "live"
                      ? "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[var(--success)]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s.status === "live" ? "Live" : "Soon"}
                </span>
              </div>
              <p className="mt-4 text-[10px]     text-muted-foreground">
                {s.kind}
              </p>
              <h2 className="mt-1 text-base font-semibold  ">
                {s.title}
              </h2>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                {s.blurb}
              </p>
              {s.status === "live" ? (
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)]">
                  Run on desk
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  Not executable on current 0G spot rails
                </p>
              )}
            </div>
          );

          if (s.status === "live" && s.href) {
            return (
              <Link key={s.id} href={s.href} className="block">
                {inner}
              </Link>
            );
          }
          return (
            <div key={s.id} className="block">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
