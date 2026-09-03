"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  BrainCircuit,
  Cpu,
  Fingerprint,
  Globe,
  Layers,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useComputeLedger } from "@/hooks/useComputeLedger";
import { useComputeQuota } from "@/hooks/useComputeQuota";
import {
  buildCategoryBreakdown,
  buildDashboardActions,
  buildHomeStats,
  buildJourneyProgress,
  buildUploadHistogram,
  networkFromChainId,
  type DashboardAction,
} from "@/lib/dashboard/homeStats";
import {
  CategoryBars,
  JourneyStepper,
  UploadHistogram,
} from "@/components/dashboard/DashboardCharts";
import { DashboardHero, greetingForHour } from "@/components/dashboard/DashboardHero";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { StatCard, QuickLink, EmptyChart } from "@/components/dashboard/StatCard";
import { loadWatcherConfig } from "@/lib/trade/watcher";
import { loadWatcherSession } from "@/lib/trade/watcherAuth";
import { VAULT_TERMS } from "@/lib/copy/vaultTerms";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function HomeDashboard() {
  const { address, isConnected, chainId } = useAccount();
  const { files, loading: filesLoading, refetch } = useUserFiles();
  const { agent, hasAgent, loading: agentLoading } = useAgenticId();
  const {
    ledgerExists,
    totalOG,
    readiness,
    loading: ledgerLoading,
  } = useComputeLedger();
  const { quotas, subsidized: quotaSubsidized } = useComputeQuota(
    readiness.operatorSubsidized
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /** Wagmi reconnects from storage before hydration — gate display until client mount. */
  const showConnected = hydrated && isConnected;

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  const network = useMemo(() => networkFromChainId(chainId), [chainId]);
  const stats = useMemo(() => buildHomeStats(files), [files]);
  const uploadChart = useMemo(() => buildUploadHistogram(files), [files]);
  const categoryChart = useMemo(() => buildCategoryBreakdown(files), [files]);
  const journey = useMemo(
    () =>
      buildJourneyProgress({
        stats,
        hasAgent: hydrated ? hasAgent : false,
        ledgerExists: hydrated ? ledgerExists : false,
        canCompute: hydrated ? readiness.canCompute : false,
        isConnected: showConnected,
      }),
    [
      stats,
      hasAgent,
      ledgerExists,
      readiness.canCompute,
      showConnected,
      hydrated,
    ]
  );

  const actions = useMemo((): DashboardAction[] => {
    if (!hydrated) {
      return [
        {
          id: "connect",
          priority: "critical",
          title: "Connect your wallet",
          detail: "Link a wallet on 0G to see vault stats and run agents.",
          href: "/dashboard",
          cta: "Connect in header",
        },
      ];
    }
    const base = buildDashboardActions({
      isConnected: showConnected,
      network,
      stats,
      hasAgent,
      agent,
      ledgerExists,
      totalOG,
      canCompute: readiness.canCompute,
      hasFundedProvider: readiness.hasFundedProvider,
      operatorSubsidized: readiness.operatorSubsidized,
    });
    const watcher = loadWatcherConfig();
    if (
      watcher.enabled &&
      !loadWatcherSession() &&
      !base.some((a) => a.id === "watcher-auth")
    ) {
      return [
        ...base,
        {
          id: "watcher-auth",
          priority: "recommended" as const,
          title: "Authorize portfolio watcher",
          detail:
            "Watcher is on but needs a fresh 24h signature to poll balances.",
          href: "/dashboard/trading/desk",
          cta: "Authorize",
        },
      ];
    }
    return base;
  }, [
    hydrated,
    showConnected,
    network,
    stats,
    hasAgent,
    agent,
    ledgerExists,
    totalOG,
    readiness.canCompute,
    readiness.hasFundedProvider,
    readiness.operatorSubsidized,
  ]);

  const primaryAction =
    actions.find((a) => a.priority !== "optional") ?? actions[0];
  const loading = filesLoading || agentLoading || ledgerLoading;
  const criticalAlerts = actions.filter((a) => a.priority === "critical").length;
  const journeyDone = journey.filter((s) => s.done).length;

  const heroGreeting = hydrated ? greetingForHour() : "Welcome back";
  const heroSubtitle =
    showConnected && address
      ? `${truncateAddress(address)}${hasAgent && agent ? ` · Agent #${agent.tokenId.toString()}` : ""} · ${network.name}`
      : "Connect a wallet on 0G to load live stats";

  const chatQuota = quotas?.chat;
  const feedQuota = quotas?.feed;
  const operatorCovered = readiness.operatorSubsidized || quotaSubsidized;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <DashboardHero
        greeting={heroGreeting}
        subtitle={
          hydrated && loading ? `${heroSubtitle} · refreshing…` : heroSubtitle
        }
        doneSteps={journeyDone}
        totalSteps={journey.length}
        primaryAction={primaryAction}
        criticalAlerts={criticalAlerts}
      />

      {/* Key metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Globe}
          label="Network"
          value={showConnected ? network.name : "—"}
          sub={
            showConnected
              ? network.onZeroG
                ? network.isTestnet
                  ? "Testnet · vault active"
                  : "Mainnet · vault active"
                : "Switch to 0G in wallet"
              : "Not connected"
          }
          accent={network.onZeroG && showConnected}
        />
        <StatCard
          icon={Upload}
          label="Files in vault"
          value={showConnected ? String(stats.vaultFiles) : "—"}
          sub={
            stats.vaultFiles > 0
              ? `${stats.agentKnowledge} in agent knowledge · ${stats.storedOnly} stored only`
              : "Upload wallet sync, CSV, or notes"
          }
        />
        <StatCard
          icon={Sparkles}
          label="Analyzed by Compute"
          value={showConnected ? String(stats.analyzedFiles) : "—"}
          sub={
            stats.vaultFiles > 0
              ? `${stats.analyzedPct}% of vault · ${stats.unlabeledFiles} need labeling`
              : "Feed files after upload"
          }
          
        />
        <StatCard
          icon={Cpu}
          label="Compute"
          value={
            !showConnected
              ? "—"
              : operatorCovered
                ? chatQuota
                  ? `${chatQuota.remaining}/${chatQuota.limit}`
                  : "Covered"
                : readiness.canCompute
                  ? "Ready"
                  : "Optional"
          }
          sub={
            operatorCovered
              ? "Chats left this week · Concierge pool"
              : readiness.canCompute
                ? "Your ledger is funded"
                : "BYO ledger is optional"
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Layers}
          label={VAULT_TERMS.knowledge}
          value={showConnected ? String(stats.agentKnowledge) : "—"}
          sub={VAULT_TERMS.knowledgeDetail}
        />
        <StatCard
          icon={MessageSquare}
          label="Chat sessions"
          value={showConnected ? String(stats.chatSessions) : "—"}
          sub="Saved conversations about your data"
        />
        <StatCard
          icon={Fingerprint}
          label="Agentic ID"
          value={
            !showConnected
              ? "—"
              : hasAgent
                ? agent?.access === "rental"
                  ? `#${agent?.tokenId.toString()} (rental)`
                  : `#${agent?.tokenId.toString()}`
                : "Not minted"
          }
          sub={
            hasAgent
              ? agent?.access === "rental"
                ? "Rented access — mint your own anytime"
                : "Owned · bound to your vault"
              : "Mint after your first chat"
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Trade activity"
          value={showConnected ? String(stats.tradeDecisions) : "—"}
          sub={
            stats.tradeDecisions > 0
              ? "Agent decisions saved — review on desk"
              : "Get Buy/Sell/Hold from the desk"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Charts + journey */}
        <div className="flex flex-col gap-4">
          <div className="dashboard-card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Upload activity</h2>
                <p className="text-xs text-muted-foreground">
                  Files registered on your vault — last 14 days
                </p>
              </div>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            {showConnected && stats.vaultFiles > 0 ? (
              <UploadHistogram buckets={uploadChart} />
            ) : (
              <EmptyChart message="Upload your first file to see activity over time" />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="dashboard-card p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold">File types</h2>
                <p className="text-xs text-muted-foreground">
                  What&apos;s in your vault today
                </p>
              </div>
              {showConnected && stats.vaultFiles > 0 ? (
                <CategoryBars buckets={categoryChart} />
              ) : (
                <EmptyChart message="No files yet" compact />
              )}
            </div>

            <div className="dashboard-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Weekly quota</h2>
                  <p className="text-xs text-muted-foreground">
                    {operatorCovered
                      ? "Free chats and file feeds this week"
                      : "BYO ledger is optional — Concierge covers testers"}
                  </p>
                </div>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </div>
              {showConnected && operatorCovered && chatQuota && feedQuota ? (
                <div className="flex flex-col gap-3 pt-2">
                  <QuotaBar
                    label="Chat"
                    remaining={chatQuota.remaining}
                    limit={chatQuota.limit}
                  />
                  <QuotaBar
                    label="Feeds"
                    remaining={feedQuota.remaining}
                    limit={feedQuota.limit}
                  />
                  <Button asChild variant="outline" size="sm" className="mt-1 w-fit rounded-full">
                    <Link href="/dashboard/knowledge/compute">View compute</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <BrainCircuit className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">
                    {showConnected
                      ? "Compute is covered for testers. Set up your own ledger only if you want to pay separately."
                      : "Connect wallet to see weekly quota."}
                  </p>
                  {showConnected ? (
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link href="/dashboard/knowledge/compute">Optional BYO setup</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card p-5">
            <JourneyStepper steps={journey} />
          </div>
        </div>

        {/* Alerts + quick links */}
        <aside className="flex flex-col gap-4">
          <NeedsAttentionPanel actions={actions} />

          <div className="dashboard-card p-5">
            <h2 className="text-sm font-semibold">Quick links</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Jump to the module you need — no duplicate menus
            </p>
            <nav className="mt-3 grid gap-1.5">
              <QuickLink href="/dashboard/vault" label="Vault" />
              <QuickLink href="/dashboard/vault/upload" label="Upload" />
              <QuickLink href="/dashboard/knowledge" label="Knowledge" />
              <QuickLink href="/dashboard/advisor/chat" label="Chat" />
              <QuickLink href="/dashboard/agent/mint" label="Agentic ID" />
              <QuickLink href="/dashboard/ecosystem" label="Ecosystem" />
              <QuickLink href="/dashboard/trading/desk" label="Trading desk (extra)" />
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuotaBar({
  label,
  remaining,
  limit,
}: {
  label: string;
  remaining: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.max(0, Math.min(100, (remaining / limit) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {remaining}/{limit} left
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
