"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Store, RefreshCw } from "lucide-react";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplace, type SaleListingView } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { toast } from "sonner";
import { truncateHash } from "@/lib/explorer";

export default function MarketplacePage() {
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <JourneyStepHeader
        step={5}
        journeyId="ecosystem"
        title="Marketplace"
        tagline="Discover and acquire data-backed agents"
        description="Browse Agentic IDs listed for sale. Buying pays the seller in OG and transfers the NFT — vault binding and board profile move with the token."
      />

      {!isConfigured && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground space-y-2">
          <p>Onchain marketplace not configured on this chain yet.</p>
          <p>
            Deploy <code className="text-xs bg-muted px-1 rounded">AgentMarketplace</code>{" "}
            then set env addresses. You can still{" "}
            <Link href="/dashboard/ecosystem/trade" className="text-primary underline">
              trade P2P
            </Link>
            .
          </p>
        </div>
      )}

      {isConfigured && (
        <>
          <section className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold">List your Agentic ID</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Approves the marketplace, then posts a sale listing.
                </p>
              </div>
              {!hasAgent && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/agent/mint">Mint first</Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Price (OG)</label>
                <Input
                  value={priceOg}
                  onChange={(e) => setPriceOg(e.target.value)}
                  className="w-36"
                  disabled={!hasAgent || loading}
                />
              </div>
              <Button
                onClick={() => void onList()}
                disabled={!isConnected || !hasAgent || loading}
                className="gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                List for sale
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Open listings</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
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

            {sales.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No active sale listings.
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {sales.map((s) => {
                  const mine =
                    address && s.seller.toLowerCase() === address.toLowerCase();
                  return (
                    <li
                      key={s.tokenId.toString()}
                      className="rounded-xl border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            Agent #{s.tokenId.toString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.domain || "no domain"} · {truncateHash(s.seller)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">{s.priceOg} OG</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {s.embeddingURI || "No board transcript bound"}
                      </p>
                      {mine ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={loading}
                          onClick={async () => {
                            try {
                              await cancelSale(s.tokenId);
                              toast.success("Listing cancelled");
                              await refresh();
                            } catch (err: unknown) {
                              toast.error(
                                err instanceof Error ? err.message : "Cancel failed"
                              );
                            }
                          }}
                        >
                          Cancel listing
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={!isConnected || loading}
                          onClick={async () => {
                            try {
                              await buy(s.tokenId, s.priceWei);
                              toast.success("Purchase complete — Agentic ID transferred");
                              await refresh();
                            } catch (err: unknown) {
                              toast.error(
                                err instanceof Error ? err.message : "Buy failed"
                              );
                            }
                          }}
                        >
                          Buy
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
