"use client";

import Link from "next/link";
import { Clock, KeyRound, Loader2 } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import type { RentListingView } from "@/hooks/useMarketplace";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import { truncateHash } from "@/lib/explorer";
import {
  MARKETPLACE_FEE_LABEL,
  netAfterMarketplaceFee,
} from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";

export const RENT_DURATIONS = [
  { label: "1 day", sec: 86_400 },
  { label: "7 days", sec: 604_800 },
  { label: "30 days", sec: 2_592_000 },
] as const;

export function formatRentDuration(sec: number) {
  if (sec >= 86_400) return `${Math.round(sec / 86_400)}d`;
  if (sec >= 3600) return `${Math.round(sec / 3600)}h`;
  return `${sec}s`;
}

export function RentListingTile({
  listing,
  durationLabel,
  mine,
  loading,
  canRent,
  rentBlockedReason,
  onRent,
  onCancel,
}: {
  listing: RentListingView;
  durationLabel: string;
  mine: boolean;
  loading: boolean;
  canRent: boolean;
  rentBlockedReason?: string;
  onRent: () => void;
  onCancel: () => void;
}) {
  const presentation = resolveAgentPresentation({
    tokenId: listing.tokenId,
    domain: listing.domain,
    aiSignature: listing.aiSignature,
    files: listing.vaultFiles,
    vaultFileCount: listing.vaultFileCount,
  });

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius)] bg-muted/40 transition-all hover:bg-muted/55",
        mine &&
          "ring-2 ring-[color-mix(in_srgb,var(--brand)_35%,transparent)]"
      )}
    >
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--brand)]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{presentation.title}</p>
            <p className="text-xs text-muted-foreground">
              {presentation.specialtyLabel} · Agentic {presentation.tokenLabel}
              {listing.vaultFileCount > 0
                ? ` · ${listing.vaultFileCount} vault file${listing.vaultFileCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
        </div>
        {mine ? (
          <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Yours
          </span>
        ) : null}
      </div>

      <div className="px-4 pb-3">
        <p className="text-2xl font-semibold tabular-nums tracking-tight">
          {listing.priceOg}
          <span className="ml-1.5 text-sm font-medium text-muted-foreground">
            OG
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            {durationLabel} lease
          </span>
          <span className="text-[11px] text-muted-foreground">
            Owner {truncateHash(listing.owner)}
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-border/40 p-3">
        {mine ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-full"
            disabled={loading}
            onClick={onCancel}
          >
            Cancel offer
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full rounded-full font-semibold"
            disabled={!canRent || loading}
            title={rentBlockedReason}
            onClick={onRent}
          >
            Rent for {listing.priceOg} OG
          </Button>
        )}
      </div>
    </article>
  );
}

export function RentOfferCard({
  agent,
  hasAgent,
  isConnected,
  loading,
  priceOg,
  durationSec,
  onPriceChange,
  onDurationChange,
  onList,
  rentActive,
  activePriceWei,
  activeDurationSec,
}: {
  agent: MyAgenticId | null;
  hasAgent: boolean;
  isConnected: boolean;
  loading: boolean;
  priceOg: string;
  durationSec: number;
  onPriceChange: (v: string) => void;
  onDurationChange: (sec: number) => void;
  onList: () => void;
  rentActive?: boolean;
  activePriceWei?: bigint;
  activeDurationSec?: number;
}) {
  const canList =
    isConnected && hasAgent && agent?.access === "owner" && !loading && !rentActive;

  const presentation = agent
    ? resolveAgentPresentation({
        tokenId: agent.tokenId,
        domain: agent.domain,
        aiSignature: agent.aiSignature,
      })
    : null;

  return (
    <div className="bento overflow-hidden">
      <div className="border-b border-border/40 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
          Offer
        </p>
        <h2 className="mt-1 text-lg font-semibold">List for rent</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Timed access — you keep the NFT · {MARKETPLACE_FEE_LABEL} fee
        </p>
      </div>

      <div className="space-y-4 p-6">
        {!isConnected ? (
          <p className="text-sm text-muted-foreground">
            Connect your wallet to offer a lease.
          </p>
        ) : !hasAgent || !agent ? (
          <>
            <p className="text-sm text-muted-foreground">
              Mint an Agentic ID first, then set price and duration.
            </p>
            <Button asChild className="w-full rounded-full">
              <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
            </Button>
          </>
        ) : agent.access === "rental" ? (
          <p className="text-sm text-muted-foreground">
            You have rental access only — ownership is required to offer leases.
          </p>
        ) : (
          <>
            <div className="rounded-2xl bg-muted/45 px-4 py-3.5">
              <p className="text-xs font-medium text-muted-foreground">
                Your agent
              </p>
              <p className="mt-1 text-base font-semibold">
                {presentation?.title ?? `#${agent.tokenId.toString()}`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {presentation?.specialtyLabel ?? "Agent"} · Agentic{" "}
                {presentation?.tokenLabel ?? `#${agent.tokenId.toString()}`}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Price in OG
              </label>
              <Input
                value={priceOg}
                onChange={(e) => onPriceChange(e.target.value)}
                disabled={loading || rentActive}
                className="h-11 rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Lease duration
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RENT_DURATIONS.map((d) => (
                  <button
                    key={d.sec}
                    type="button"
                    onClick={() => onDurationChange(d.sec)}
                    disabled={loading || rentActive}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      durationSec === d.sec
                        ? "bg-[var(--brand)] text-white"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {Number(priceOg) > 0 && !rentActive ? (
              <p className="text-xs text-muted-foreground">
                You receive ~
                {formatEther(netAfterMarketplaceFee(parseEther(priceOg)))} OG
                per rental after fee
              </p>
            ) : null}

            {rentActive && activePriceWei != null && activeDurationSec ? (
              <p className="rounded-xl bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] px-3 py-2 text-xs font-medium text-[var(--brand)]">
                Live at {formatEther(activePriceWei)} OG /{" "}
                {formatRentDuration(activeDurationSec)} — cancel from Browse →
                Yours
              </p>
            ) : null}

            <Button
              size="lg"
              className="w-full gap-2 rounded-full"
              disabled={!canList}
              onClick={onList}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {rentActive ? "Already offering" : "List for rent"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
