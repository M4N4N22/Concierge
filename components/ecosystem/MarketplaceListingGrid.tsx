"use client";

import Link from "next/link";
import { Fingerprint, Loader2, Store } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import type { SaleListingView } from "@/hooks/useMarketplace";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import { truncateHash } from "@/lib/explorer";
import {
  MARKETPLACE_FEE_LABEL,
  netAfterMarketplaceFee,
} from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";

export function SaleListingTile({
  listing,
  mine,
  loading,
  canBuy,
  buyBlockedReason,
  onBuy,
  onCancel,
}: {
  listing: SaleListingView;
  mine: boolean;
  loading: boolean;
  canBuy: boolean;
  buyBlockedReason?: string;
  onBuy: () => void;
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
            <Fingerprint className="h-5 w-5" />
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
        <p className="mt-1 text-[11px] text-muted-foreground">
          Seller {truncateHash(listing.seller)}
        </p>
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
            Cancel listing
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full rounded-full font-semibold"
            disabled={!canBuy || loading}
            title={buyBlockedReason}
            onClick={onBuy}
          >
            Buy for {listing.priceOg} OG
          </Button>
        )}
      </div>
    </article>
  );
}

export function MarketplaceSellCard({
  agent,
  hasAgent,
  isConnected,
  loading,
  priceOg,
  onPriceChange,
  onList,
  saleActive,
  activePriceWei,
}: {
  agent: MyAgenticId | null;
  hasAgent: boolean;
  isConnected: boolean;
  loading: boolean;
  priceOg: string;
  onPriceChange: (v: string) => void;
  onList: () => void;
  saleActive?: boolean;
  activePriceWei?: bigint;
}) {
  const canList =
    isConnected && hasAgent && agent?.access === "owner" && !loading && !saleActive;

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
          Sell
        </p>
        <h2 className="mt-1 text-lg font-semibold">List your Agentic ID</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {MARKETPLACE_FEE_LABEL} platform fee · you keep the rest
        </p>
      </div>

      <div className="space-y-4 p-6">
        {!isConnected ? (
          <p className="text-sm text-muted-foreground">
            Connect your wallet to list for sale.
          </p>
        ) : !hasAgent || !agent ? (
          <>
            <p className="text-sm text-muted-foreground">
              Mint an Agentic ID first, then set a price in OG.
            </p>
            <Button asChild className="w-full rounded-full">
              <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
            </Button>
          </>
        ) : agent.access === "rental" ? (
          <p className="text-sm text-muted-foreground">
            You have rental access only — ownership is required to sell.
          </p>
        ) : (
          <>
            <div className="rounded-2xl bg-muted/45 px-4 py-3.5">
              <p className="text-xs font-medium text-muted-foreground">
                Listing
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
                disabled={loading || saleActive}
                className="h-11 rounded-xl text-base"
              />
            </div>

            {Number(priceOg) > 0 && !saleActive ? (
              <p className="text-xs text-muted-foreground">
                You receive ~
                {formatEther(netAfterMarketplaceFee(parseEther(priceOg)))} OG
                after fee
              </p>
            ) : null}

            {saleActive && activePriceWei != null ? (
              <p className="rounded-xl bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] px-3 py-2 text-xs font-medium text-[var(--brand)]">
                Live at {formatEther(activePriceWei)} OG — cancel from Browse
                → Yours
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
                <Store className="h-4 w-4" />
              )}
              {saleActive ? "Already listed" : "List for sale"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function MarketplaceEmpty({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: typeof Store;
  title: string;
  detail: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
        <Icon className="h-7 w-7 text-muted-foreground/70" />
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>
      {action ? (
        <Button asChild className="mt-5 rounded-full">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
