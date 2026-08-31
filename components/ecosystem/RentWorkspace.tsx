"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Fingerprint,
  KeyRound,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { cn } from "@/lib/utils";
import { useMarketplace, type RentListingView } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { truncateHash } from "@/lib/explorer";

const DURATIONS = [
  { label: "1 day", sec: 86_400 },
  { label: "7 days", sec: 604_800 },
  { label: "30 days", sec: 2_592_000 },
] as const;

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: KeyRound,
    title: "What is Rent?",
    body: "Time-bound access to an Agentic ID. Renters pay OG; you keep ownership. Access is checked on-chain for Talk and related flows.",
  },
  {
    id: "list",
    icon: Fingerprint,
    title: "Offer a lease",
    body: "Set price and duration. No NFT transfer — only a rental lease is recorded until expiry or cancel.",
  },
  {
    id: "rent",
    icon: Wallet,
    title: "Rent access",
    body: "Pay the listed OG amount to start the lease. When it ends, access returns to the owner only.",
  },
  {
    id: "sell",
    icon: ArrowUpRight,
    title: "Want to sell?",
    body: "Use Marketplace for ownership transfer with payment, or Transfer for a direct P2P send.",
  },
];

function formatDuration(sec: number) {
  if (sec >= 86_400) return `${Math.round(sec / 86_400)}d`;
  if (sec >= 3600) return `${Math.round(sec / 3600)}h`;
  return `${sec}s`;
}

export default function RentWorkspace() {
  const {
    isConfigured,
    isConnected,
    loading,
    fetchRents,
    listForRent,
    cancelRent,
    rent,
    address,
  } = useMarketplace();
  const { agent, hasAgent } = useAgenticId();

  const [rents, setRents] = useState<RentListingView[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [priceOg, setPriceOg] = useState("0.05");
  const [durationSec, setDurationSec] = useState(86_400);

  const refresh = useCallback(async () => {
    if (!isConfigured) {
      setRents([]);
      return;
    }
    setRefreshing(true);
    try {
      setRents(await fetchRents());
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load rentals"
      );
    } finally {
      setRefreshing(false);
    }
  }, [fetchRents, isConfigured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mineCount = rents.filter(
    (r) => address && r.owner.toLowerCase() === address.toLowerCase()
  ).length;

  const primaryCta = !hasAgent
    ? { href: "/dashboard/agent/mint", label: "Mint Agentic ID" }
    : { href: "/dashboard/ecosystem/marketplace", label: "Open Marketplace" };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Ecosystem · Rent
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Share access, keep ownership
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            List timed leases on your Agentic ID. Renters pay OG; the token stays
            yours.
          </p>
        </div>
        <Button asChild className="rounded-full px-5" variant="outline">
          <Link href={primaryCta.href}>
            {primaryCta.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Open rentals
                </span>
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {!isConfigured ? "—" : refreshing ? "…" : rents.length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Active lease listings
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">Yours</span>
                <Fingerprint className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {!isConnected
                  ? "—"
                  : hasAgent && agent
                    ? `#${agent.tokenId.toString()}`
                    : "None"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                {mineCount > 0
                  ? `${mineCount} offer${mineCount === 1 ? "" : "s"} by you`
                  : hasAgent
                    ? "Ready to offer rent"
                    : "Mint to offer"}
              </p>
            </div>

            <div className="bento-ink relative overflow-hidden p-5">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-12 w-12 rounded-full opacity-100 blur-xl"
                style={{
                  background:
                    "radial-gradient(circle, var(--brand) 100%, transparent 100%)",
                }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">Contract</span>
                <Wallet className="h-4 w-4 text-white/70" />
              </div>
              <p className="relative mt-5 text-2xl font-semibold tracking-tight text-white">
                {isConfigured ? "Live" : "Unset"}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                {isConfigured
                  ? "Rentals enabled"
                  : "Deploy marketplace to enable"}
              </p>
            </div>
          </div>

          {!isConfigured ? (
            <div className="bento px-6 py-10 text-center">
              <KeyRound className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Rentals not configured</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Deploy the marketplace contract to enable on-chain rent listings.
                Ownership never leaves the lessor — only a lease is recorded.
              </p>
            </div>
          ) : (
            <>
              <section className="bento overflow-hidden">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      Offer rental access
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      No NFT transfer — renters get a timed lease
                    </p>
                  </div>
                  {!hasAgent ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard/agent/mint">Mint first</Link>
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-3 border-t border-border/50 px-5 py-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Price (OG)
                    </label>
                    <Input
                      value={priceOg}
                      onChange={(e) => setPriceOg(e.target.value)}
                      className="w-36"
                      disabled={!hasAgent || loading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Duration
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.sec}
                          type="button"
                          onClick={() => setDurationSec(d.sec)}
                          disabled={!hasAgent || loading}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                            durationSec === d.sec
                              ? "bg-[var(--brand)] text-white"
                              : "bg-muted/60 text-foreground hover:bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={!isConnected || !hasAgent || loading}
                    onClick={async () => {
                      if (!agent) return;
                      try {
                        await listForRent(agent.tokenId, priceOg, durationSec);
                        toast.success("Rental listed");
                        await refresh();
                      } catch (err: unknown) {
                        toast.error(
                          err instanceof Error ? err.message : "List failed"
                        );
                      }
                    }}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    List for rent
                  </Button>
                </div>
              </section>

              <section className="bento overflow-hidden">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      Open rentals
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Rent access until the lease expires
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 shrink-0"
                    onClick={() => void refresh()}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>

                <div className="border-t border-border/50 px-5 py-4">
                  {rents.length === 0 ? (
                    <div className="rounded-2xl bg-muted/40 px-6 py-10 text-center">
                      <p className="text-sm font-medium">No active rentals</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Offer a lease on your Agentic ID above
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rents.map((r) => {
                        const mine =
                          !!address &&
                          r.owner.toLowerCase() === address.toLowerCase();
                        return (
                          <div
                            key={r.tokenId.toString()}
                            className={cn(
                              "flex flex-col gap-3 rounded-2xl bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between",
                              mine &&
                                "bg-[color-mix(in_srgb,var(--brand)_8%,var(--surface))]"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">
                                  Agentic #{r.tokenId.toString()}
                                </p>
                                <span className="text-sm font-medium tabular-nums">
                                  {r.priceOg} OG
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {formatDuration(r.durationSec)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {r.domain || "no domain"} ·{" "}
                                {truncateHash(r.owner)}
                                {mine ? " · you" : ""}
                              </p>
                            </div>
                            {mine ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                disabled={loading}
                                onClick={async () => {
                                  try {
                                    await cancelRent(r.tokenId);
                                    toast.success("Rental listing cancelled");
                                    await refresh();
                                  } catch (err: unknown) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Cancel failed"
                                    );
                                  }
                                }}
                              >
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="shrink-0"
                                disabled={!isConnected || loading}
                                onClick={async () => {
                                  try {
                                    await rent(r.tokenId, r.priceWei);
                                    toast.success(
                                      "Rental started — access granted until expiry"
                                    );
                                    await refresh();
                                  } catch (err: unknown) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Rent failed"
                                    );
                                  }
                                }}
                              >
                                Rent access
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <CollapsibleGuideRail items={GUIDE} />
      </div>
    </div>
  );
}
