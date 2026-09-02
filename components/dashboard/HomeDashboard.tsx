"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  BrainCircuit,
  Cpu,
  Fingerprint,
  Globe,
  Layers,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useComputeLedger, formatOG } from "@/hooks/useComputeLedger";
import { useTradeBalances } from "@/hooks/useTradeBalances";
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
  LedgerGauge,
  UploadHistogram,
} from "@/components/dashboard/DashboardCharts";
import { DashboardHero, greetingForHour } from "@/components/dashboard/DashboardHero";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { StatCard, QuickLink, EmptyChart } from "@/components/dashboard/StatCard";
import { loadWatcherConfig } from "@/lib/trade/watcher";
import { loadWatcherSession } from "@/lib/trade/watcherAuth";
import { VAULT_TERMS } from "@/lib/copy/vaultTerms";
import { cn } from "@/lib/utils";

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
    availableOG,
    readiness,
    loading: ledgerLoading,
    refresh: refreshLedger,
  } = useComputeLedger();
  const { rows: balanceRows, loading: balLoading } = useTradeBalances();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /** Wagmi reconnects from storage before hydration — gate display until client mount. */
  const showConnected = hydrated && isConnected;

  useEffect(() => {
    if (isConnected) {
      void refetch({ silent: true });
      void refreshLedger();
    }
  }, [isConnected, chainId, refetch, refreshLedger]);

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
  ]);

  const primaryAction = actions[0];
  const loading = filesLoading || agentLoading || ledgerLoading;
  const criticalAlerts = actions.filter((a) => a.priority === "critical").length;
  const journeyDone = journey.filter((s) => s.done).length;

  const heroGreeting = hydrated ? greetingForHour() : "Welcome back";
  const heroSubtitle =
    showConnected && address
      ? `${truncateAddress(address)}${hasAgent && agent ? ` · Agent #${agent.tokenId.toString()}` : ""} · ${network.name}`
      : "Connect a wallet on 0G to load live stats";

  const ogRow = balanceRows.find((r) => r.id === "og");
  const usdcRow = balanceRows.find((r) => r.id === "usdc");

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
              : "Run Insights after upload"
          }
          highlight
        />
        <StatCard
          icon={Cpu}
          label="Compute ledger"
          value={
            !showConnected
              ? "—"
              : ledgerExists
                ? `${formatOG(totalOG)} OG`
                : "Not created"
          }
          sub={
            ledgerExists
              ? `${formatOG(availableOG)} OG available for AI calls`
              : "Create once · deposit OG for agents"
          }
          ink
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

      {/* Wallet snapshot strip */}
      {showConnected && (
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniBalance
            label="OG / W0G"
            value={balLoading ? "…" : ogRow?.balance ?? "0"}
            loading={balLoading}
          />
          <MiniBalance
            label="USDC"
            value={balLoading ? "…" : usdcRow?.balance ?? "0"}
            loading={balLoading}
          />
          <MiniBalance
            label="Compute ready"
            value={
              readiness.canCompute
                ? "Yes"
                : ledgerExists
                  ? "Partial"
                  : "No"
            }
            loading={ledgerLoading}
            hint={
              readiness.canCompute
                ? "Ledger funded · provider ready"
                : !ledgerExists
                  ? "Create ledger first"
                  : totalOG <= 0
                    ? "Deposit OG"
                    : "Fund a model provider"
            }
          />
        </div>
      )}

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
                  <h2 className="text-sm font-semibold">Compute balance</h2>
                  <p className="text-xs text-muted-foreground">
                    Prepaid OG for AI inference
                  </p>
                </div>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              {showConnected && ledgerExists ? (
                <div className="flex flex-col items-center gap-2">
                  <LedgerGauge
                    totalOG={totalOG}
                    availableOG={availableOG}
                    exists={ledgerExists}
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    {formatOG(totalOG)} OG total · {formatOG(availableOG)}{" "}
                    available
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/dashboard/vault/insights">Manage ledger</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <BrainCircuit className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">
                    {showConnected
                      ? "Create a ledger to run Insights, Chat, and Trading agents."
                      : "Connect wallet to check ledger status."}
                  </p>
                  {showConnected && (
                    <Button asChild size="sm" className="rounded-full">
                      <Link href="/dashboard/vault/insights">Set up Compute</Link>
                    </Button>
                  )}
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
              <QuickLink href="/dashboard/vault/my-files" label="Vault" />
              <QuickLink href="/dashboard/vault/insights" label="Insights" />
              <QuickLink href="/dashboard/advisor/chat" label="Chat" />
              <QuickLink href="/dashboard/agent/mint" label="Agentic ID" />
              <QuickLink href="/dashboard/trading/desk" label="Trading desk" />
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MiniBalance({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="dashboard-card flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-lg font-semibold tabular-nums",
            loading && "animate-pulse text-muted-foreground"
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className="truncate text-[10px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
