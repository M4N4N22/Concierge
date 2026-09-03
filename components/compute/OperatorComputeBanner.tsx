"use client";

import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { cn } from "@/lib/utils";

export function OperatorComputeBanner({ className }: { className?: string }) {
  const { readiness, operator } = useComputeLedgerContext();

  if (!readiness.operatorSubsidized || !readiness.operatorReady) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[color-mix(in_srgb,var(--brand)_28%,transparent)] bg-[color-mix(in_srgb,var(--brand)_8%,transparent)] px-4 py-3.5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_16%,transparent)] text-[var(--brand)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Compute covered by Concierge</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {operator?.copy ??
                "Early access — inference runs on our 0G Private Computer pool. No ledger setup needed."}
              {readiness.freeTierChatWeeklyLimit > 0 ||
              readiness.freeTierFeedWeeklyLimit > 0 ? (
                <>
                  {" "}
                  Free tier: {readiness.freeTierChatWeeklyLimit} chats and{" "}
                  {readiness.freeTierFeedWeeklyLimit} file feeds per wallet per
                  week.
                </>
              ) : null}
            </p>
            {operator?.routerModel ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Model: {operator.routerModel}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={operator?.privateComputerUrl ?? "https://pc.0g.ai"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--brand)] hover:underline"
        >
          Private Computer
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
