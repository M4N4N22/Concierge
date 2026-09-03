"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { cn } from "@/lib/utils";

type QuotaState = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: number | null;
};

type EIP1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

/**
 * Phase 2 — optional top-up when daily free tier is exhausted.
 * Embeds 0G Pay when @0gfoundation/0g-pay-sdk is installed; otherwise links out.
 */
export function ComputeTopUpPanel({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { readiness, operator } = useComputeLedgerContext();
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [loading, setLoading] = useState(false);
  const [PayWidget, setPayWidget] = useState<
    React.ComponentType<{ provider: EIP1193Provider }> | null
  >(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setQuota(null);
      return;
    }
    setLoading(true);
    fetch(`/api/compute/quota?wallet=${address}`)
      .then((r) => r.json())
      .then((data) => setQuota(data.quota ?? null))
      .catch(() => setQuota(null))
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_OG_PAY !== "true") return;
    import("@0gfoundation/0g-pay-sdk")
      .then((mod) =>
        setPayWidget(() => mod.OGPay as React.ComponentType<{ provider: EIP1193Provider }>)
      )
      .catch(() => setPayWidget(null));
  }, []);

  if (!readiness.operatorSubsidized) return null;

  const exhausted = quota != null && quota.remaining <= 0;
  const pcUrl = operator?.privateComputerUrl ?? "https://pc.0g.ai";

  return (
    <div className={cn("bento p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <CreditCard className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Need more compute?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking daily allowance…
              </span>
            ) : quota ? (
              <>
                {quota.remaining} of {quota.limit} free actions left today
                {exhausted ? " — limit reached." : "."}
              </>
            ) : (
              <>Top up on 0G Private Computer to extend usage beyond the free tier.</>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {PayWidget && typeof window !== "undefined" && window.ethereum ? (
              <PayWidget provider={window.ethereum} />
            ) : (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href={pcUrl} target="_blank" rel="noopener noreferrer">
                  Manage funds
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            {!PayWidget ? (
              <span className="self-center text-[10px] text-muted-foreground">
                Set NEXT_PUBLIC_ENABLE_OG_PAY=true to embed 0G Pay
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
