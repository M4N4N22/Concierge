"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WatcherStatus } from "@/hooks/usePortfolioWatcher";
import { Eye, EyeOff, Loader2, Radio } from "lucide-react";

type Props = {
  status: WatcherStatus;
  disabled?: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onRefresh: () => void;
  onOrchestratePending: () => void;
  onDismissPending: () => void;
};

export function PortfolioWatcherPanel({
  status,
  disabled,
  onEnable,
  onDisable,
  onRefresh,
  onOrchestratePending,
  onDismissPending,
}: Props) {
  const { enabled, checking, orchestrating, sessionValid, pendingShift } =
    status;

  return (
    <section className="bento overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Radio
              className={cn(
                "h-4 w-4",
                enabled && sessionValid
                  ? "text-[var(--brand)]"
                  : "text-muted-foreground"
              )}
            />
            <h2 className="text-sm font-semibold  ">
              Portfolio watcher
            </h2>
            {enabled ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-semibold    ",
                  sessionValid
                    ? "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-[var(--brand)]"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                )}
              >
                {sessionValid ? "live" : "auth expired"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Polls every {Math.round(status.config.pollMs / 60_000)} min · shift
            threshold ${status.config.usdcDeltaMin} USDC or{" "}
            {Math.round(status.config.ogPctDeltaMin * 100)}% OG
          </p>
          {status.lastCheckedAt ? (
            <p className="mt-1 text-[10px] text-muted-foreground/80">
              Last check {new Date(status.lastCheckedAt).toLocaleTimeString()}
              {status.lastTriggerReason
                ? ` · ${status.lastTriggerReason}`
                : ""}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {enabled ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={disabled || checking || orchestrating}
                onClick={onRefresh}
              >
                {(checking || orchestrating) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Check now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                disabled={disabled}
                onClick={onDisable}
              >
                <EyeOff className="h-3.5 w-3.5" />
                Pause
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="rounded-full"
              disabled={disabled}
              onClick={onEnable}
            >
              <Eye className="h-3.5 w-3.5" />
              Enable watcher
            </Button>
          )}
        </div>
      </div>

      {pendingShift ? (
        <div className="border-b border-border/50 bg-[color-mix(in_srgb,var(--brand)_5%,transparent)] px-5 py-4">
          <p className="text-xs font-medium">
            Shift detected — heuristic{" "}
            <span className="  text-[var(--brand)]">
              {pendingShift.suggestion.side}
            </span>
            {pendingShift.suggestion.side !== "hold"
              ? ` · ${pendingShift.suggestion.size} ${
                  pendingShift.suggestion.sizeIsQuote ? "USDC" : "OG"
                }`
              : ""}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {pendingShift.suggestion.rationale}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={orchestrating}
              onClick={onOrchestratePending}
            >
              {orchestrating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Re-run agents
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={onDismissPending}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {!enabled ? (
        <p className="px-5 py-4 text-[11px] leading-relaxed text-muted-foreground">
          Sign once for 24 hours. On balance shifts the watcher previews a
          local heuristic, then optionally re-runs 0G Compute agents within a
          15-minute cooldown.
        </p>
      ) : null}
    </section>
  );
}
