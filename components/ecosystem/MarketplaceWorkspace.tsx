"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Fingerprint,
  Loader2,
  RefreshCw,
  Store,
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
import { useMarketplace, type SaleListingView } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { truncateHash } from "@/lib/explorer";

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: Store,
    title: "Marketplace sales",
    body: "List your Agentic ID for OG. Buyers pay on-chain; ownership and encrypted metadata transfer together.",
  },
  {
    id: "list",
    icon: Fingerprint,
    title: "List for sale",
    body: "Approves the marketplace contract, then posts a price. Cancel anytime before someone buys.",
  },
  {
    id: "buy",
    icon: Wallet,
    title: "Buy",
    body: "Pay the listed OG amount. You receive the Agentic ID — recipient wallet must not already own one on this contract.",
  },
  {
    id: "transfer",
    icon: ArrowUpRight,
    title: "Prefer P2P?",
    body: "No escrow needed? Use Transfer to send directly. Rent shares access without selling ownership.",
  },
];

export default function MarketplaceWorkspace() {
  const {
    isConfigured,
    isConnected,
    loading,
    fetchSales,
    listForSale,
    cancelSale,
    buy,
    address,
  } = useMarketplace();
  const { agent, hasAgent } = useAgenticId();

  const [sales, setSales] = useState<SaleListingView[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [priceOg, setPriceOg] = useState("0.1");

  const refresh = useCallback(async () => {
    if (!isConfigured) {
      setSales([]);
      return;
    }
    setRefreshing(true);
    try {
      setSales(await fetchSales());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setRefreshing(false);
    }
  }, [fetchSales, isConfigured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mineCount = sales.filter(
    (s) => address && s.seller.toLowerCase() === address.toLowerCase()
  ).length;

  const onList = async () => {
    if (!agent) {
      toast.error("Mint an Agentic ID first");
      return;
    }
    try {
      await listForSale(agent.tokenId, priceOg);
      toast.success("Listed for sale");
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "List failed");
    }
  };

  const primaryCta = !hasAgent
    ? { href: "/dashboard/agent/mint", label: "Mint Agentic ID" }
    : { href: "/dashboard/ecosystem/rent", label: "Open Rent" };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Ecosystem · Marketplace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Buy & sell Agentic IDs
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Escrowed sales in OG. Vault binding and encrypted metadata move with
            the token.
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
                  Open listings
                </span>
                <Store className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {!isConfigured ? "—" : refreshing ? "…" : sales.length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Active sale listings
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
                  ? `${mineCount} listing${mineCount === 1 ? "" : "s"} by you`
                  : hasAgent
                    ? "Ready to list"
                    : "Mint to list"}
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
                  ? "Marketplace deployed"
                  : "Use Transfer for P2P"}
              </p>
            </div>
          </div>

          {!isConfigured ? (
            <div className="bento px-6 py-10 text-center">
              <Store className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Marketplace not configured</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Deploy AgentMarketplace and set env addresses. You can still{" "}
                <Link
                  href="/dashboard/ecosystem/trade"
                  className="text-[var(--brand)] underline-offset-2 hover:underline"
                >
                  transfer P2P
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <section className="bento overflow-hidden">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      List your Agentic ID
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Approves marketplace · posts a sale price in OG
                    </p>
                  </div>
                  {!hasAgent ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard/agent/mint">Mint first</Link>
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-2 border-t border-border/50 px-5 py-4">
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
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => void onList()}
                    disabled={!isConnected || !hasAgent || loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Store className="h-4 w-4" />
                    )}
                    List for sale
                  </Button>
                </div>
              </section>

              <section className="bento overflow-hidden">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      Open listings
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Buy transfers the Agentic ID to your wallet
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
                  {sales.length === 0 ? (
                    <div className="rounded-2xl bg-muted/40 px-6 py-10 text-center">
                      <p className="text-sm font-medium">No active listings</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Be the first to list an Agentic ID
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sales.map((s) => {
                        const mine =
                          !!address &&
                          s.seller.toLowerCase() === address.toLowerCase();
                        return (
                          <div
                            key={s.tokenId.toString()}
                            className={cn(
                              "flex flex-col gap-3 rounded-2xl bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between",
                              mine &&
                                "bg-[color-mix(in_srgb,var(--brand)_8%,var(--surface))]"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">
                                  Agentic #{s.tokenId.toString()}
                                </p>
                                <span className="text-sm font-medium tabular-nums">
                                  {s.priceOg} OG
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {s.domain || "no domain"} ·{" "}
                                {truncateHash(s.seller)}
                                {mine ? " · you" : ""}
                              </p>
                              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                                {s.embeddingURI || "No profile URI"}
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
                                    await cancelSale(s.tokenId);
                                    toast.success("Listing cancelled");
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
                                    await buy(s.tokenId, s.priceWei);
                                    toast.success(
                                      "Purchase complete — Agentic ID transferred"
                                    );
                                    await refresh();
                                  } catch (err: unknown) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Buy failed"
                                    );
                                  }
                                }}
                              >
                                Buy
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
