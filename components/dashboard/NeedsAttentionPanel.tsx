"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { DashboardAction, ActionPriority } from "@/lib/dashboard/homeStats";
import { cn } from "@/lib/utils";

const SEVERITY: Record<
  ActionPriority,
  {
    iconBg: string;
    iconColor: string;
    rowBg: string;
    rowHover: string;
    border: string;
    badge: string;
    badgeCls: string;
  }
> = {
  critical: {
    iconBg: "bg-red-100 dark:bg-red-950/60",
    iconColor: "text-red-600 dark:text-red-400",
    rowBg: "bg-red-50/90 dark:bg-red-950/25",
    rowHover: "hover:bg-red-100/90 dark:hover:bg-red-950/40",
    border: "border-red-200/70 dark:border-red-900/50",
    badge: "Required",
    badgeCls:
      "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  },
  recommended: {
    iconBg: "bg-amber-100 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    rowBg: "bg-amber-50/90 dark:bg-amber-950/20",
    rowHover: "hover:bg-amber-100/90 dark:hover:bg-amber-950/35",
    border: "border-amber-200/70 dark:border-amber-900/40",
    badge: "Suggested",
    badgeCls:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  optional: {
    iconBg: "bg-yellow-100 dark:bg-yellow-950/40",
    iconColor: "text-yellow-700 dark:text-yellow-400",
    rowBg: "bg-yellow-50/80 dark:bg-yellow-950/15",
    rowHover: "hover:bg-yellow-100/80 dark:hover:bg-yellow-950/30",
    border: "border-yellow-200/60 dark:border-yellow-900/35",
    badge: "When ready",
    badgeCls:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300",
  },
};

export function NeedsAttentionPanel({
  actions,
  className,
}: {
  actions: DashboardAction[];
  className?: string;
}) {
  const criticalCount = actions.filter((a) => a.priority === "critical").length;
  const hasAlerts = actions.length > 0;

  return (
    <div className={cn("dashboard-card flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              hasAlerts
                ? criticalCount > 0
                  ? "bg-red-100 dark:bg-red-950/50"
                  : "bg-amber-100 dark:bg-amber-950/50"
                : "bg-emerald-100 dark:bg-emerald-950/40"
            )}
          >
            {hasAlerts ? (
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  criticalCount > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
                strokeWidth={2.25}
              />
            ) : (
              <CheckCircle2
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                strokeWidth={2.25}
              />
            )}
          </span>
          <div>
            <h2 className="text-sm font-semibold">Needs attention</h2>
            <p className="text-[11px] text-muted-foreground">
              {hasAlerts
                ? `${actions.length} item${actions.length === 1 ? "" : "s"} · act when you can`
                : "Everything looks healthy"}
            </p>
          </div>
        </div>
        {hasAlerts && actions.length > 4 ? (
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
            Top {Math.min(6, actions.length)}
          </span>
        ) : null}
      </div>

      <ul className="mt-4 space-y-2">
        {!hasAlerts ? (
          <li className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 px-3.5 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Vault, compute, and agents are in good shape. Explore Trading or
              Ecosystem from the sidebar when you&apos;re ready.
            </p>
          </li>
        ) : (
          actions.slice(0, 6).map((action) => (
            <AlertRow key={action.id} action={action} />
          ))
        )}
      </ul>
    </div>
  );
}

function AlertRow({ action }: { action: DashboardAction }) {
  const sev = SEVERITY[action.priority];

  return (
    <li>
      <Link
        href={action.href}
        className={cn(
          "group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors",
          sev.rowBg,
          sev.rowHover,
          sev.border
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            sev.iconBg
          )}
        >
          <AlertTriangle
            className={cn("h-4 w-4", sev.iconColor)}
            strokeWidth={2.25}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-foreground">
              {action.title}
            </p>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                sev.badgeCls
              )}
            >
              {sev.badge}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
            {action.detail}
          </p>
        </div>

        <span
          className={cn(
            "hidden shrink-0 items-center gap-0.5 text-[11px] font-semibold sm:inline-flex",
            sev.iconColor
          )}
        >
          {action.cta}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </Link>
    </li>
  );
}
