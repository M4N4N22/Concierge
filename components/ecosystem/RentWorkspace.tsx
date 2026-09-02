"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { EcosystemSubnav } from "@/components/ecosystem/EcosystemSubnav";
import { MarketplaceEmpty } from "@/components/ecosystem/MarketplaceListingGrid";
import {
  RentListingTile,
  RentOfferCard,
  formatRentDuration,
} from "@/components/ecosystem/RentListingGrid";
import { useMarketplace, type RentListingView } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useEcosystemDashboard } from "@/hooks/useEcosystemDashboard";
import { formatOgAmount } from "@/lib/dashboard/ecosystemStats";
import { MARKETPLACE_FEE_LABEL } from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";

type BrowseTab = "all" | "mine";

export default function RentWorkspace() {
  const { isConnected, address } = useAccount();
  const {
    isConfigured,
    loading,
    fetchRents,
    listForRent,
    cancelRent,
    rent,
  } = useMarketplace();
  const { agent, hasAgent, refetch: refetchAgent } = useAgenticId();
  const { stats, refresh: refreshStats } = useEcosystemDashboard(agent);

  const [rents, setRents] = useState<RentListingView[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [priceOg, setPriceOg] = useState("0.05");
  const [durationSec, setDurationSec] = useState(86_400);
  const [tab, setTab] = useState<BrowseTab>("all");

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

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), refreshStats(), refetchAgent()]);
  }, [refresh, refreshStats, refetchAgent]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rentEarnings = useMemo(
    () =>
      stats.activities
        .filter((a) => a.kind === "rent_in")
        .reduce((sum, a) => sum + a.netWei, 0n),
    [stats.activities]
  );

  const visible = useMemo(() => {
    if (tab === "mine" && address) {
      return rents.filter(
        (r) => r.owner.toLowerCase() === address.toLowerCase()
      );
    }
    return rents;
  }, [address, rents, tab]);

  const onList = async () => {
    if (!agent || agent.access !== "owner") {
      toast.error("You need to own an Agentic ID to offer a lease");
      return;
    }
    try {
      await listForRent(agent.tokenId, priceOg, durationSec);
      toast.success("Rental listed");
      setTab("mine");
      await refreshAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "List failed");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <EcosystemSubnav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Rent</h1>
          <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
            Timed Concierge access shaped by the owner&apos;s vault — not a dump
            of their private files. Ownership stays with the lessor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isConfigured ? (
            <>
              <span className="rounded-full bg-muted/70 px-3 py-1 text-xs font-medium tabular-nums">
                {rents.length} offer{rents.length === 1 ? "" : "s"}
              </span>
              {isConnected && rentEarnings > 0n ? (
                <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-3 py-1 text-xs font-medium tabular-nums text-[var(--success)]">
                  +{formatOgAmount(rentEarnings)} OG earned
                </span>
              ) : null}
              {isConnected && agent?.access === "rental" && agent.rentalExpiresAt ? (
                <span className="rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--brand)]">
                  Your lease active
                </span>
              ) : null}
            </>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              Not configured
            </span>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-full"
            onClick={() => void refreshAll()}
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
      </div>

      {!isConfigured ? (
        <div className="bento">
          <MarketplaceEmpty
            icon={KeyRound}
            title="Rentals not live on this chain"
            detail="Deploy the marketplace contract or switch network. Transfer is still free P2P."
            action={{ href: "/dashboard/ecosystem/trade", label: "Transfer" }}
          />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="bento min-h-[320px] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
              <div className="flex gap-1 rounded-full bg-muted/50 p-1">
                {(["all", "mine"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                      tab === t
                        ? "bg-[var(--surface)] text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "all" ? "Browse" : "Yours"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {MARKETPLACE_FEE_LABEL} fee on rentals
              </p>
            </div>

            {visible.length === 0 ? (
              <MarketplaceEmpty
                icon={KeyRound}
                title={tab === "mine" ? "No offers yet" : "No rentals yet"}
                detail={
                  tab === "mine"
                    ? "Offer timed Concierge access from the panel on the right."
                    : "Be the first to rent out Concierge access — or check back soon."
                }
                action={
                  !hasAgent
                    ? { href: "/dashboard/agent/mint", label: "Mint Agentic ID" }
                    : undefined
                }
              />
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((r) => {
                  const mine =
                    !!address &&
                    r.owner.toLowerCase() === address.toLowerCase();
                  return (
                    <RentListingTile
                      key={r.tokenId.toString()}
                      listing={r}
                      durationLabel={formatRentDuration(r.durationSec)}
                      mine={mine}
                      loading={loading}
                      canRent={isConnected && !mine}
                      onCancel={async () => {
                        try {
                          await cancelRent(r.tokenId);
                          toast.success("Rental offer cancelled");
                          await refreshAll();
                        } catch (err: unknown) {
                          toast.error(
                            err instanceof Error ? err.message : "Cancel failed"
                          );
                        }
                      }}
                      onRent={async () => {
                        try {
                          await rent(r.tokenId, r.priceWei);
                          toast.success(
                            "Rental started — Concierge access until expiry"
                          );
                          await refreshAll();
                        } catch (err: unknown) {
                          toast.error(
                            err instanceof Error ? err.message : "Rent failed"
                          );
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-3 lg:sticky lg:top-4">
            <RentOfferCard
              agent={agent}
              hasAgent={hasAgent}
              isConnected={isConnected}
              loading={loading}
              priceOg={priceOg}
              durationSec={durationSec}
              onPriceChange={setPriceOg}
              onDurationChange={setDurationSec}
              onList={() => void onList()}
              rentActive={stats.listing?.rentActive}
              activePriceWei={stats.listing?.rentPriceWei}
              activeDurationSec={stats.listing?.rentDurationSec}
            />

            <div className="rounded-[var(--radius)] px-1 text-center text-[11px] text-muted-foreground">
              <Link
                href="/dashboard/ecosystem/marketplace"
                className="font-medium text-[var(--brand)] hover:underline"
              >
                Marketplace
              </Link>
              {" · "}
              <Link
                href="/dashboard/ecosystem/trade"
                className="font-medium text-[var(--brand)] hover:underline"
              >
                Transfer
              </Link>
              {" · "}
              <Link
                href="/dashboard/ecosystem"
                className="font-medium text-[var(--brand)] hover:underline"
              >
                Hub
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
