"use client";

import Link from "next/link";
import { ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EcosystemPageHero({
  eyebrow,
  title,
  subtitle,
  meta,
  primaryAction,
  onRefresh,
  refreshing,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  meta?: string;
  primaryAction?: { href: string; label: string };
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}) {
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
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-medium text-white/75">{eyebrow}</p>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
          <p className="max-w-xl text-sm text-white/80">{subtitle}</p>
          {meta ? (
            <p className="text-xs text-white/70">{meta}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          ) : null}
          {primaryAction ? (
            <Button
              asChild
              size="sm"
              className="rounded-full bg-white px-5 text-black shadow-md hover:bg-white/95"
            >
              <Link href={primaryAction.href}>
                {primaryAction.label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
