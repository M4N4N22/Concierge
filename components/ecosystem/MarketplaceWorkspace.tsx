"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { EcosystemSubnav } from "@/components/ecosystem/EcosystemSubnav";
import {
  MarketplaceEmpty,
  MarketplaceSellCard,
  SaleListingTile,
} from "@/components/ecosystem/MarketplaceListingGrid";
import { useMarketplace, type SaleListingView } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useEcosystemDashboard } from "@/hooks/useEcosystemDashboard";
import { formatOgAmount } from "@/lib/dashboard/ecosystemStats";
import { MARKETPLACE_FEE_LABEL } from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";

type BrowseTab = "all" | "mine";

export default function MarketplaceWorkspace() {
  const { isConnected, address } = useAccount();
  const {
    isConfigured,
    loading,
    fetchSales,
    listForSale,
    cancelSale,
    buy,
  } = useMarketplace();
  const { agent, hasAgent, refetch: refetchAgent } = useAgenticId();
  const { stats, refresh: refreshStats } = useEcosystemDashboard(agent);

  const [sales, setSales] = useState<SaleListingView[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [priceOg, setPriceOg] = useState("0.1");
  const [tab, setTab] = useState<BrowseTab>("all");

  const refresh = useCallback(async () => {
    if (!isConfigured) {
      setSales([]);
      return;
    }
    setRefreshing(true);
    try {
      setSales(await fetchSales());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setRefreshing(false);
    }
  }, [fetchSales, isConfigured]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), refreshStats(), refetchAgent()]);
  }, [refresh, refreshStats, refetchAgent]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saleEarnings = useMemo(
    () =>
      stats.activities
        .filter((a) => a.kind === "sale_in")
        .reduce((sum, a) => sum + a.netWei, 0n),
    [stats.activities]
  );

  const visible = useMemo(() => {
    if (tab === "mine" && address) {
      return sales.filter(
        (s) => s.seller.toLowerCase() === address.toLowerCase()
      );
    }
    return sales;
  }, [address, sales, tab]);

  const onList = async () => {
    if (!agent || agent.access !== "owner") {
      toast.error("You need to own an Agentic ID to list it");
      return;
    }
    try {
      await listForSale(agent.tokenId, priceOg);
      toast.success("Listed for sale");
      setTab("mine");
      await refreshAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "List failed");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <EcosystemSubnav />

      {/* Slim header — listings start immediately below */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Marketplace</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Buy and sell Agentic IDs in OG
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isConfigured ? (
            <>
              <span className="rounded-full bg-muted/70 px-3 py-1 text-xs font-medium tabular-nums">
                {sales.length} listing{sales.length === 1 ? "" : "s"}
              </span>
              {isConnected && saleEarnings > 0n ? (
                <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-3 py-1 text-xs font-medium tabular-nums text-[var(--success)]">
                  +{formatOgAmount(saleEarnings)} OG earned
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
            icon={Store}
            title="Marketplace not live on this chain"
            detail="Deploy the contract or switch network. You can still transfer P2P for free."
            action={{ href: "/dashboard/ecosystem/trade", label: "Transfer" }}
          />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* LISTINGS FIRST — main column */}
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
                {MARKETPLACE_FEE_LABEL} fee on sales
              </p>
            </div>

            {visible.length === 0 ? (
              <MarketplaceEmpty
                icon={Store}
                title={tab === "mine" ? "Nothing listed yet" : "No listings yet"}
                detail={
                  tab === "mine"
                    ? "List your agent from the panel on the right."
                    : "Be the first seller — or check back soon."
                }
                action={
                  !hasAgent
                    ? { href: "/dashboard/agent/mint", label: "Mint Agentic ID" }
                    : undefined
                }
              />
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((s) => {
                  const mine =
                    !!address &&
                    s.seller.toLowerCase() === address.toLowerCase();
                  return (
                    <SaleListingTile
                      key={s.tokenId.toString()}
                      listing={s}
                      mine={mine}
                      loading={loading}
                      canBuy={isConnected && !hasAgent && !mine}
                      buyBlockedReason={
                        hasAgent
                          ? "One Agentic ID per wallet on this chain"
                          : undefined
                      }
                      onCancel={async () => {
                        try {
                          await cancelSale(s.tokenId);
                          toast.success("Listing cancelled");
                          await refreshAll();
                        } catch (err: unknown) {
                          toast.error(
                            err instanceof Error ? err.message : "Cancel failed"
                          );
                        }
                      }}
                      onBuy={async () => {
                        try {
                          await buy(s.tokenId, s.priceWei);
                          toast.success("Agentic ID is yours");
                          await refreshAll();
                        } catch (err: unknown) {
                          toast.error(
                            err instanceof Error ? err.message : "Buy failed"
                          );
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Sell sidebar */}
          <aside className="flex flex-col gap-3 lg:sticky lg:top-4">
            <MarketplaceSellCard
              agent={agent}
              hasAgent={hasAgent}
              isConnected={isConnected}
              loading={loading}
              priceOg={priceOg}
              onPriceChange={setPriceOg}
              onList={() => void onList()}
              saleActive={stats.listing?.saleActive}
              activePriceWei={stats.listing?.salePriceWei}
            />

            <div className="rounded-[var(--radius)] px-1 text-center text-[11px] text-muted-foreground">
              <Link
                href="/dashboard/ecosystem/rent"
                className="font-medium text-[var(--brand)] hover:underline"
              >
                Rent
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
