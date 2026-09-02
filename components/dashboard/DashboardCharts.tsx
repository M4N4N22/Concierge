"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ChartBucket } from "@/lib/dashboard/homeStats";

export function UploadHistogram({
  buckets,
  className,
}: {
  buckets: ChartBucket[];
  className?: string;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.value));

  return (
    <div className={cn("flex h-40 items-end gap-1.5", className)}>
      {buckets.map((b) => {
        const pct = (b.value / max) * 100;
        const hasData = b.value > 0;
        return (
          <div
            key={b.label}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className="text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {b.value}
            </span>
            <div className="flex h-28 w-full items-end rounded-t-xl bg-muted/60 p-0.5">
              <div
                className={cn(
                  "w-full rounded-t-[10px] transition-all duration-300",
                  hasData
                    ? "bg-gradient-to-t from-[var(--brand)] to-[color-mix(in_srgb,var(--brand)_55%,#818cf8)] group-hover:opacity-90"
                    : "bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--muted-foreground)_12%,transparent)_0px,color-mix(in_srgb,var(--muted-foreground)_12%,transparent)_4px,transparent_4px,transparent_8px)]"
                )}
                style={{ height: hasData ? `${Math.max(12, pct)}%` : "18%" }}
              />
            </div>
            <span className="truncate text-[9px] font-medium text-muted-foreground">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CategoryBars({
  buckets,
  className,
}: {
  buckets: ChartBucket[];
  className?: string;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const total = buckets.reduce((s, b) => s + b.value, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Upload files to see a breakdown by type.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {buckets.map((b) => (
          <div
            key={b.label}
            className="h-full transition-all"
            style={{
              width: `${(b.value / total) * 100}%`,
              background: b.color ?? "var(--brand)",
            }}
            title={`${b.label}: ${b.value}`}
          />
        ))}
      </div>
      <ul className="space-y-2">
        {buckets.map((b) => (
          <li key={b.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: b.color ?? "var(--brand)" }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {b.label}
            </span>
            <span className="tabular-nums font-medium">{b.value}</span>
            <div className="hidden w-16 sm:block">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(b.value / max) * 100}%`,
                    background: b.color ?? "var(--brand)",
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JourneyStepper({
  steps,
  className,
}: {
  steps: { id: string; label: string; done: boolean; href: string }[];
  className?: string;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = steps.length ? (doneCount / steps.length) * 100 : 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">Your journey</span>
        <span className="tabular-nums text-muted-foreground">
          {doneCount}/{steps.length} complete
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[color-mix(in_srgb,var(--brand)_70%,#6366f1)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 text-center transition-colors hover:bg-accent/60",
              step.done ? "opacity-100" : "opacity-50"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold shadow-sm",
                step.done
                  ? "bg-[var(--brand)] text-white"
                  : "bg-muted text-muted-foreground ring-1 ring-border"
              )}
            >
              {step.done ? "✓" : "·"}
            </span>
            <span className="text-[10px] font-medium leading-tight">
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LedgerGauge({
  totalOG,
  availableOG,
  exists,
  className,
}: {
  totalOG: number;
  availableOG: number;
  exists: boolean;
  className?: string;
}) {
  const pct =
    exists && totalOG > 0
      ? Math.min(100, Math.round((availableOG / totalOG) * 100))
      : 0;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg viewBox="0 0 120 70" className="h-24 w-full max-w-[160px]">
        <path
          d="M 15 65 A 45 45 0 0 1 105 65"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <path
          d="M 15 65 A 45 45 0 0 1 105 65"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 141.4} 141.4`}
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <p className="text-lg font-semibold tabular-nums">
          {exists ? `${pct}%` : "—"}
        </p>
        <p className="text-[10px] text-muted-foreground">available</p>
      </div>
    </div>
  );
}

/** OG earnings per week — values are OG amounts (not counts). */
export function EarningsHistogram({
  buckets,
  className,
}: {
  buckets: ChartBucket[];
  className?: string;
}) {
  const max = Math.max(0.001, ...buckets.map((b) => b.value));

  return (
    <div className={cn("flex h-40 items-end gap-1.5", className)}>
      {buckets.map((b) => {
        const pct = (b.value / max) * 100;
        const hasData = b.value > 0;
        return (
          <div
            key={b.label}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className="text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {hasData ? `${b.value} OG` : "—"}
            </span>
            <div className="flex h-28 w-full items-end rounded-t-xl bg-muted/60 p-0.5">
              <div
                className={cn(
                  "w-full rounded-t-[10px] transition-all duration-300",
                  hasData
                    ? "bg-gradient-to-t from-emerald-600 to-[color-mix(in_srgb,var(--brand)_60%,#34d399)] group-hover:opacity-90"
                    : "bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--muted-foreground)_12%,transparent)_0px,color-mix(in_srgb,var(--muted-foreground)_12%,transparent)_4px,transparent_4px,transparent_8px)]"
                )}
                style={{ height: hasData ? `${Math.max(12, pct)}%` : "18%" }}
              />
            </div>
            <span className="truncate text-[9px] font-medium text-muted-foreground">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
