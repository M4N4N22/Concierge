"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardAction } from "@/lib/dashboard/homeStats";
import { cn } from "@/lib/utils";

export function DashboardHero({
  greeting,
  subtitle,
  doneSteps,
  totalSteps,
  primaryAction,
  criticalAlerts,
  className,
}: {
  greeting: string;
  subtitle: string;
  doneSteps: number;
  totalSteps: number;
  primaryAction?: DashboardAction;
  criticalAlerts: number;
  className?: string;
}) {
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div
      className={cn(
        "dashboard-hero relative overflow-hidden rounded-[var(--radius)] p-5 sm:p-6",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)",
        }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-[11px] font-medium text-white/75">Concierge</p>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {greeting}
            </h1>
            <p className="mt-1 max-w-md text-sm text-white/80">{subtitle}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-xs text-white/85">
              <span>Setup progress</span>
              <span className="tabular-nums font-semibold">
                {doneSteps} / {totalSteps} steps
              </span>
            </div>
            <div className="h-2 max-w-xs overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {criticalAlerts > 0 ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-red-500/25 px-2.5 py-1 text-[10px] font-semibold text-white ring-1 ring-red-300/30">
              <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
              {criticalAlerts} required action
              {criticalAlerts === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {primaryAction && primaryAction.href !== "/dashboard" ? (
          <Button
            asChild
            size="sm"
            className="relative rounded-full bg-white px-5 text-black shadow-md hover:bg-white/95"
          >
            <Link href={primaryAction.href}>
              {primaryAction.cta}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
