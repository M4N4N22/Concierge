"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatReadiness } from "@/lib/chat/chatReadiness";
import { cn } from "@/lib/utils";

export function ChatReadinessPanel({
  readiness,
  compact,
  onRefresh,
  refreshing,
}: {
  readiness: ChatReadiness;
  compact?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  if (readiness.canSend && compact) return null;

  const Icon = readiness.blocker === "loading" ? Loader2 : readiness.canSend ? Sparkles : AlertCircle;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius)] border",
        readiness.canSend
          ? " bg-[color-mix(in_srgb,var(--success)_8%,transparent)]"
          : " bg-white/5"
      )}
    >
      <div className={cn("px-5 py-4", compact && "py-3")}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
              readiness.canSend
                ? "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                readiness.blocker === "loading" && "animate-spin"
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{readiness.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {readiness.detail}
            </p>
          </div>
          {!readiness.canSend && onRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          ) : null}
        </div>

        {!compact && !readiness.hideSteps && readiness.steps.length > 0 ? (
          <ol className="mt-4 space-y-2">
            {readiness.steps.map((step) => (
              <li key={step.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      step.done
                        ? "text-muted-foreground line-through"
                        : "font-medium"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!step.done && step.href && step.action ? (
                  <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
                    <Link href={step.href}>{step.action}</Link>
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
