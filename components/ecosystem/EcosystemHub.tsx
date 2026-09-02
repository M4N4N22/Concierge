"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { formatEther } from "viem";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Clock,
  Fingerprint,
  KeyRound,
  Loader2,
  RefreshCw,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { StatCard, EmptyChart } from "@/components/dashboard/StatCard";
import { EarningsHistogram } from "@/components/dashboard/DashboardCharts";
import { greetingForHour } from "@/components/dashboard/DashboardHero";
import { getAgentDisplayName } from "@/lib/agentDisplayName";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useEcosystemDashboard } from "@/hooks/useEcosystemDashboard";
import { MARKETPLACE_ADDRESSES } from "@/lib/addresses";
import { isConfiguredContract } from "@/lib/agentAccess";
import {
  activityKindLabel,
  formatOgAmount,
} from "@/lib/dashboard/ecosystemStats";
import { MARKETPLACE_FEE_LABEL } from "@/lib/marketplaceConstants";
import { truncateHash } from "@/lib/explorer";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { EcosystemSubnav } from "@/components/ecosystem/EcosystemSubnav";
import { cn } from "@/lib/utils";

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: Store,
    title: "Ecosystem hub",
    body: "Track earnings, manage listings, and move Agentic IDs — sales, rentals, or P2P transfer.",
  },
  {
    id: "fees",
    icon: TrendingUp,
    title: "Platform fee",
    body: `${MARKETPLACE_FEE_LABEL} on marketplace sales and rentals. Sellers and lessors receive the net amount after the fee.`,
  },
  {
    id: "rent",
    icon: KeyRound,
    title: "Rent vs transfer",
    body: "Rent shares timed access — you keep ownership. Transfer gives the NFT away for free with no marketplace fee.",
  },
];

const PATHS = [
  {
    href: "/dashboard/ecosystem/marketplace",
    title: "Marketplace",
    detail: "List or buy for OG",
    icon: Store,
  },
  {
    href: "/dashboard/ecosystem/rent",
    title: "Rent",
    detail: "Timed access · keep ownership",
    icon: KeyRound,
  },
  {
    href: "/dashboard/ecosystem/trade",
    title: "Transfer",
    detail: "Free P2P send",
    icon: ArrowLeftRight,
  },
] as const;

function networkLabel(chainId: number) {
  if (chainId === zeroGMainnet.id) return "0G Mainnet";
  if (chainId === zeroGTestnet.id) return "Galileo";
  return `Chain ${chainId}`;
}

function formatDuration(sec: number) {
  if (sec >= 86_400) return `${Math.round(sec / 86_400)}d`;
  if (sec >= 3600) return `${Math.round(sec / 3600)}h`;
  return `${sec}s`;
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function EcosystemHub() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [hydrated, setHydrated] = useState(false);
  const { agent, hasAgent, loading: agentLoading, refetch: refetchAgent } =
    useAgenticId();
  const { files } = useUserFiles();
  const { stats, loading: statsLoading, refresh } = useEcosystemDashboard(agent);

  useEffect(() => setHydrated(true), []);

  const marketConfigured = !!isConfiguredContract(
    MARKETPLACE_ADDRESSES,
    chainId
  );
  const showConnected = hydrated && isConnected;
  const loading = agentLoading || statsLoading;

  const agentPresentation = useMemo(() => {
    if (!agent) return null;
    return resolveAgentPresentation({
      tokenId: agent.tokenId,
      domain: agent.domain,
      aiSignature: agent.aiSignature,
      files,
      displayName: getAgentDisplayName(chainId, agent.tokenId),
    });
  }, [agent, chainId, files]);

  const primaryCta = useMemo(() => {
    if (!showConnected) return null;
    if (!hasAgent) {
      return { href: "/dashboard/agent/mint", label: "Mint Agentic ID" };
    }
    if (stats.listing?.saleActive || stats.listing?.rentActive) {
      return { href: "/dashboard/ecosystem/marketplace", label: "Manage listings" };
    }
    return { href: "/dashboard/ecosystem/marketplace", label: "List for sale" };
  }, [hasAgent, showConnected, stats.listing]);

  const greeting = hydrated ? greetingForHour() : "Welcome";
  const subtitle = showConnected && address
    ? `${truncateAddress(address)} · ${networkLabel(chainId)}${loading ? " · syncing…" : ""}`
    : "Connect a wallet on 0G to see your ecosystem stats";

  const hasEarnings = stats.earningsBuckets.some((b) => b.value > 0);
  const recentActivity = stats.activities.slice(0, 6);

  const onRefresh = async () => {
    await Promise.all([refetchAgent(), refresh()]);
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <EcosystemSubnav />

      {/* Hero */}
      <div className="dashboard-hero relative overflow-hidden rounded-[var(--radius)] p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-medium text-white/75">Ecosystem</p>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {greeting}
            </h1>
            <p className="max-w-lg text-sm text-white/80">{subtitle}</p>
            {showConnected && marketConfigured ? (
              <p className="text-xs text-white/70">
                Net earned{" "}
                <span className="font-semibold tabular-nums text-white">
                  {formatOgAmount(stats.totalEarnedWei)} OG
                </span>
                {stats.incomeEvents > 0
                  ? ` · ${stats.incomeEvents} payout${stats.incomeEvents === 1 ? "" : "s"}`
                  : " · no payouts yet"}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => void onRefresh()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            {primaryCta ? (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-white px-5 text-black shadow-md hover:bg-white/95"
              >
                <Link href={primaryCta.href}>
                  {primaryCta.label}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {!marketConfigured ? (
        <div className="rounded-[var(--radius)] bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium">Marketplace not configured on this chain</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sales and rentals need AgentMarketplace deployed. P2P transfer still
            works via Transfer.
          </p>
        </div>
      ) : null}

      {/* Key metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Net earned"
          value={
            showConnected && marketConfigured
              ? `${formatOgAmount(stats.totalEarnedWei)} OG`
              : "—"
          }
          sub={
            stats.incomeEvents > 0
              ? `${stats.incomeEvents} sale/rent payout${stats.incomeEvents === 1 ? "" : "s"} · after ${MARKETPLACE_FEE_LABEL} fee`
              : "Complete a sale or rental to earn OG"
          }
          highlight
        />
        <StatCard
          icon={Store}
          label="Your listings"
          value={
            !showConnected
              ? "—"
              : hasAgent
                ? String(stats.activeListings)
                : "0"
          }
          sub={
            stats.listing?.saleActive && stats.listing?.rentActive
              ? "Sale + rent active on your agent"
              : stats.listing?.saleActive
                ? `Listed for ${formatEther(stats.listing.salePriceWei ?? 0n)} OG`
                : stats.listing?.rentActive
                  ? `Rent ${formatEther(stats.listing.rentPriceWei ?? 0n)} OG / ${formatDuration(stats.listing.rentDurationSec ?? 0)}`
                  : hasAgent
                    ? "Not listed — open Marketplace or Rent"
                    : "Mint an Agentic ID first"
          }
        />
        <StatCard
          icon={Wallet}
          label="Market activity"
          value={
            showConnected && marketConfigured
              ? String(stats.marketSaleCount + stats.marketRentCount)
              : "—"
          }
          sub={
            marketConfigured
              ? `${stats.marketSaleCount} for sale · ${stats.marketRentCount} for rent on-chain`
              : "Deploy marketplace to enable"
          }
          accent
        />
        <StatCard
          icon={Fingerprint}
          label="Agentic ID"
          value={
            !showConnected
              ? "—"
              : hasAgent && agent
                ? `#${agent.tokenId.toString()}`
                : "None"
          }
          sub={
            hasAgent && agent
              ? agent.access === "rental"
                ? `Rental · expires ${agent.rentalExpiresAt ? new Date(agent.rentalExpiresAt * 1000).toLocaleDateString() : "soon"}`
                : agentPresentation
                  ? `${agentPresentation.specialtyLabel} · ready to list`
                  : "Owner · ready to list"
              : "Mint to participate in the ecosystem"
          }
          ink
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="flex flex-col gap-4">
          {/* Your agent */}
          <section className="dashboard-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Your agent</h2>
                <p className="text-xs text-muted-foreground">
                  Ownership, access type, and listing status
                </p>
              </div>
              {hasAgent ? (
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href="/dashboard/agent/learning">Agent profile</Link>
                </Button>
              ) : null}
            </div>
            <div className="border-t border-border/50 px-5 py-4">
              {!showConnected ? (
                <EmptyChart message="Connect wallet to load your Agentic ID" compact />
              ) : !hasAgent || !agent ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl bg-muted/40 px-5 py-6">
                  <Fingerprint className="h-8 w-8 text-muted-foreground/60" />
                  <div>
                    <p className="text-sm font-medium">No Agentic ID yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mint one to list, rent out, or transfer on the ecosystem.
                    </p>
                  </div>
                  <Button asChild size="sm" className="rounded-full">
                    <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">
                        {agentPresentation?.title ?? `Agentic #${agent.tokenId.toString()}`}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {agentPresentation?.specialtyLabel ?? "Agent"}
                        {" · "}
                        Agentic {agentPresentation?.tokenLabel ?? `#${agent.tokenId.toString()}`}
                        {agentPresentation && agentPresentation.fileCount > 0
                          ? ` · ${agentPresentation.fileCount} vault files`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                        agent.access === "rental"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-[var(--brand)]"
                      )}
                    >
                      {agent.access === "rental" ? "Rental access" : "Owner"}
                    </span>
                  </div>

                  <dl className="grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/45 px-3 py-2.5 sm:col-span-2">
                      <dt className="text-muted-foreground">About</dt>
                      <dd className="mt-0.5 text-[11px] leading-relaxed">
                        {agentPresentation?.subtitle ?? "Concierge agent on 0G"}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-muted/45 px-3 py-2.5">
                      <dt className="text-muted-foreground">Profile binding</dt>
                      <dd className="mt-0.5 text-[11px]">
                        {agentPresentation?.bindingLabel ?? "—"}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-muted/45 px-3 py-2.5">
                      <dt className="text-muted-foreground">Vault</dt>
                      <dd className="mt-0.5 font-mono text-[11px]">
                        {truncateHash(agent.vault)}
                      </dd>
                    </div>
                  </dl>

                  {agent.access === "owner" && stats.listing ? (
                    <div className="flex flex-wrap gap-2">
                      {stats.listing.saleActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          <Store className="h-3 w-3" />
                          Sale · {formatEther(stats.listing.salePriceWei ?? 0n)} OG
                        </span>
                      ) : null}
                      {stats.listing.rentActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-300">
                          <KeyRound className="h-3 w-3" />
                          Rent · {formatEther(stats.listing.rentPriceWei ?? 0n)} OG /{" "}
                          {formatDuration(stats.listing.rentDurationSec ?? 0)}
                        </span>
                      ) : null}
                      {!stats.listing.saleActive && !stats.listing.rentActive ? (
                        <span className="text-[11px] text-muted-foreground">
                          Not listed on marketplace
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {agent.access === "rental" && agent.rentalExpiresAt ? (
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Access until{" "}
                      {new Date(agent.rentalExpiresAt * 1000).toLocaleString()}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {agent.access === "owner" ? (
                      <>
                        <Button asChild size="sm" className="rounded-full">
                          <Link href="/dashboard/ecosystem/marketplace">Marketplace</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                          <Link href="/dashboard/ecosystem/rent">Offer rent</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                          <Link href="/dashboard/ecosystem/trade">Transfer</Link>
                        </Button>
                      </>
                    ) : (
                      <Button asChild size="sm" className="rounded-full">
                        <Link href="/dashboard/advisor/chat">Use in Chat</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recent activity */}
          <section className="dashboard-card overflow-hidden">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <p className="text-xs text-muted-foreground">
                Your marketplace transactions on this chain
              </p>
            </div>
            <div className="border-t border-border/50 px-5 py-3">
              {!showConnected || !marketConfigured ? (
                <EmptyChart
                  message={
                    marketConfigured
                      ? "Connect wallet to see activity"
                      : "Marketplace not configured"
                  }
                  compact
                />
              ) : recentActivity.length === 0 ? (
                <EmptyChart
                  message="No sales or rentals yet — list your agent or browse the market"
                  compact
                />
              ) : (
                <ul className="divide-y divide-border/40">
                  {recentActivity.map((item) => {
                    const isIncome =
                      item.kind === "sale_in" || item.kind === "rent_in";
                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {activityKindLabel(item.kind)} ·{" "}
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            isIncome ? "text-emerald-600 dark:text-emerald-400" : ""
                          )}
                        >
                          {isIncome ? "+" : "−"}
                          {formatOgAmount(isIncome ? item.netWei : item.grossWei)}{" "}
                          OG
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          {/* Earnings chart */}
          <section className="dashboard-card overflow-hidden">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold">Earnings</h2>
              <p className="text-xs text-muted-foreground">
                Net OG received per week (after {MARKETPLACE_FEE_LABEL} fee)
              </p>
            </div>
            <div className="border-t border-border/50 px-5 py-4">
              {!showConnected || !marketConfigured ? (
                <EmptyChart message="Connect on a configured chain" compact />
              ) : !hasEarnings ? (
                <EmptyChart message="No earnings yet — sales and rentals appear here" />
              ) : (
                <EarningsHistogram buckets={stats.earningsBuckets} />
              )}
            </div>
            {showConnected && stats.totalSpentWei > 0n ? (
              <div className="border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
                Spent{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatOgAmount(stats.totalSpentWei)} OG
                </span>{" "}
                on purchases and rentals
              </div>
            ) : null}
          </section>

          {/* Quick paths */}
          <section className="dashboard-card overflow-hidden">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold">Quick paths</h2>
              <p className="text-xs text-muted-foreground">
                One tap to list, rent, or transfer
              </p>
            </div>
            <div className="grid gap-2 border-t border-border/50 px-4 py-3">
              {PATHS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-accent/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-[var(--brand)] group-hover:bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </section>

          <CollapsibleGuideRail items={GUIDE} />
        </div>
      </div>
    </div>
  );
}
