"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, KeyRound, RefreshCw } from "lucide-react";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplace, type RentListingView } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { toast } from "sonner";
import { truncateHash } from "@/lib/explorer";

const DURATIONS = [
  { label: "1 day", sec: 86_400 },
  { label: "7 days", sec: 604_800 },
  { label: "30 days", sec: 2_592_000 },
] as const;

function formatDuration(sec: number) {
  if (sec >= 86_400) return `${Math.round(sec / 86_400)}d`;
  if (sec >= 3600) return `${Math.round(sec / 3600)}h`;
  return `${sec}s`;
}

export default function RentPage() {
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
      toast.error(err instanceof Error ? err.message : "Failed to load rentals");
    } finally {
      setRefreshing(false);
    }
  }, [fetchRents, isConfigured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <JourneyStepHeader
        step={5}
        journeyId="ecosystem"
        title="Rent & Delegate"
        tagline="Share agent access without giving up ownership"
        description="List time-bound board access for your Agentic ID. Renters pay in OG; you keep the NFT. Access is enforced onchain via hasAccess(tokenId, user)."
      />

      {!isConfigured && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
          Deploy the marketplace contract to enable onchain rent listings. Ownership
          never leaves the lessor — only a rental lease is recorded.
        </div>
      )}

      {isConfigured && (
        <>
          <section className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold">Offer rental access</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No NFT transfer — renters get a timed lease.
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
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Duration</label>
                <div className="flex gap-1">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.sec}
                      type="button"
                      onClick={() => setDurationSec(d.sec)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        durationSec === d.sec
                          ? "bg-primary text-primary-foreground border-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="gap-2"
                disabled={!isConnected || !hasAgent || loading}
                onClick={async () => {
                  if (!agent) return;
                  try {
                    await listForRent(agent.tokenId, priceOg, durationSec);
                    toast.success("Rental listed");
                    await refresh();
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "List failed");
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

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Open rentals</h2>
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

            {rents.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No active rental listings.
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {rents.map((r) => {
                  const mine =
                    address && r.owner.toLowerCase() === address.toLowerCase();
                  return (
                    <li
                      key={r.tokenId.toString()}
                      className="rounded-xl border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            Agent #{r.tokenId.toString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.domain || "no domain"} · {truncateHash(r.owner)} ·{" "}
                            {formatDuration(r.durationSec)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">{r.priceOg} OG</p>
                      </div>
                      {mine ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={loading}
                          onClick={async () => {
                            try {
                              await cancelRent(r.tokenId);
                              toast.success("Rental listing cancelled");
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
                              await rent(r.tokenId, r.priceWei);
                              toast.success("Rental started — access granted until expiry");
                              await refresh();
                            } catch (err: unknown) {
                              toast.error(
                                err instanceof Error ? err.message : "Rent failed"
                              );
                            }
                          }}
                        >
                          Rent access
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
