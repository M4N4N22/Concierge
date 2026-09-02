"use client";

import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  highlight,
  ink,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  highlight?: boolean;
  ink?: boolean;
}) {
  const className = cn(
    "dashboard-card flex flex-col justify-between p-5",
    highlight && " ",
    ink && "",
    accent && !highlight && !ink && ""
  );
  const labelCls = highlight || ink ? "text-white/80" : "text-muted-foreground";
  const valueCls = highlight || ink ? "text-white" : "text-foreground";
  const subCls = highlight || ink ? "text-white/70" : "text-muted-foreground";
  const iconCls = highlight || ink ? "text-white/80" : "text-muted-foreground";

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", labelCls)}>{label}</span>
        <Icon className={cn("h-4 w-4", iconCls)} />
      </div>
      <p
        className={cn(
          "mt-4 text-2xl font-semibold tabular-nums sm:text-3xl",
          valueCls
        )}
      >
        {value}
      </p>
      <p className={cn("mt-1 text-[11px] leading-relaxed", subCls)}>{sub}</p>
    </div>
  );
}

export function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors hover:bg-accent/80"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}

export function EmptyChart({
  message,
  compact,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-center text-sm text-muted-foreground",
        compact ? "py-6" : "h-36"
      )}
    >
      {message}
    </div>
  );
}
