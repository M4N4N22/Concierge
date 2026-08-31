"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  FileStack,
  Fingerprint,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOURNEY_STEPS } from "@/lib/journey";
import { isEvidenceCategory } from "@/lib/evidence";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useAgenticId } from "@/hooks/useAgenticId";
import { cn } from "@/lib/utils";

type NextAction = {
  label: string;
  href: string;
  explainer: string;
  cta: string;
};

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function HomeDashboard() {
  const { address, isConnected, chainId } = useAccount();
  const { files, loading: filesLoading, refetch } = useUserFiles();
  const { agent, hasAgent, loading: agentLoading } = useAgenticId();

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  const stats = useMemo(() => {
    const evidence = files.filter((f) => isEvidenceCategory(f.category));
    const boards = files.filter((f) => f.category === "evidence:board");
    const trades = files.filter((f) => f.category === "evidence:trade");
    const withInsights = files.filter(
      (f) => f.insightsCID && f.insightsCID !== "" && f.insightsCID !== "0x"
    );
    return {
      vaultFiles: files.length,
      evidencePacks: evidence.length,
      boardSessions: boards.length,
      tradeTraces: trades.length,
      insightsReady: withInsights.length,
    };
  }, [files]);

  const nextAction = useMemo((): NextAction => {
    if (!isConnected) {
      return {
        label: "Connect wallet",
        href: "/dashboard",
        explainer: "Link a wallet on 0G to unlock vault, board, and Agentic ID.",
        cta: "Connect in header →",
      };
    }
    if (stats.vaultFiles === 0) {
      return {
        label: "Ingest evidence",
        href: "/dashboard/vault/my-files",
        explainer: "Wallet sync, CSV, or paste — facts the board can cite.",
        cta: "Open Vault",
      };
    }
    if (stats.boardSessions === 0) {
      return {
        label: "Talk to your data",
        href: "/dashboard/advisor/talk",
        explainer: "Ask about spend, patterns, and vault evidence.",
        cta: "Open Talk",
      };
    }
    if (!hasAgent) {
      return {
        label: "Mint Agentic ID",
        href: "/dashboard/agent/mint",
        explainer: "Mint your on-chain AI agent identity bound to the vault.",
        cta: "Mint Agentic ID",
      };
    }
    return {
      label: "Trading desk",
      href: "/dashboard/trading/desk",
      explainer: "Agent Buy/Sell/Hold from wallet balances, then you confirm.",
      cta: "Open Desk",
    };
  }, [hasAgent, isConnected, stats.boardSessions, stats.vaultFiles]);

  const loading = filesLoading || agentLoading;
  const evidencePct =
    stats.vaultFiles > 0
      ? Math.min(100, Math.round((stats.evidencePacks / stats.vaultFiles) * 100))
      : 0;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col gap-4">
      {/* Top bar */}
      <header className="flex flex-wrap items-end justify-between gap-4 shrink-0">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Concierge
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Vault · Board · Ownership
          </h1>
          <p className="text-sm text-muted-foreground">
            {isConnected && address
              ? `${truncateAddress(address)}${hasAgent && agent ? ` · Agentic #${agent.tokenId}` : ""}`
              : "Connect a wallet to load live vault stats"}
            {loading ? " · refreshing…" : ""}
          </p>
        </div>
        {nextAction.href !== "/dashboard" ? (
          <Button asChild className="rounded-full px-5 shadow-none">
            <Link href={nextAction.href}>
              {nextAction.cta}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button className="rounded-full px-5" disabled>
            {nextAction.cta}
          </Button>
        )}
      </header>

      {/* Module pills */}
      <div className="flex shrink-0 flex-wrap gap-2">
        {JOURNEY_STEPS.map((step) => {
          const live = step.status === "live" && step.href;
          if (!live || !step.href) return null;
          return (
            <Link
              key={step.id}
              href={step.href}
              className="rounded-full bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-foreground ring-1 ring-border transition-colors hover:bg-[var(--brand)] hover:text-white hover:ring-[var(--brand)]"
            >
              {step.shortTitle}
            </Link>
          );
        })}
      </div>

      {/* Bento: main + right rail */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_32rem]">
        <div className="flex min-h-0 flex-col gap-4">
          {/* Stat row */}
          <div className="grid shrink-0 gap-3 sm:grid-cols-3">
            <div className="bento flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Vault files
                </span>
                <FileStack className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-6 text-3xl font-semibold tabular-nums tracking-tight">
                {isConnected ? stats.vaultFiles : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Registered on your personal vault
              </p>
            </div>

            <div className="bento-brand flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">
                  Evidence packs
                </span>
                <Layers className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-6 text-3xl font-semibold tabular-nums tracking-tight text-white">
                {isConnected ? stats.evidencePacks : "—"}
                {isConnected && stats.vaultFiles > 0 ? (
                  <span className="ml-2 text-sm font-medium text-white/70">
                    {evidencePct}%
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                Schema-first facts agents can cite
              </p>
            </div>

            <div className="bento-ink relative flex flex-col justify-between overflow-hidden p-5">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-12 w-12 rounded-full opacity-100 blur-xl"
                style={{
                  background:
                    "radial-gradient(circle, var(--brand) 100%, transparent 100%)",
                }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  Next step
                </span>
                <ShieldCheck className="h-4 w-4 text-white/70" />
              </div>
              <div className="relative mt-4 space-y-2">
                <p className="text-lg font-semibold leading-snug text-white">
                  {nextAction.label}
                </p>
                <p className="text-[11px] leading-relaxed text-white/65">
                  {nextAction.explainer}
                </p>
              </div>
              {nextAction.href !== "/dashboard" ? (
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="relative mt-4 w-fit rounded-full bg-white text-foreground hover:bg-white/90"
                >
                  <Link href={nextAction.href}>
                    {nextAction.cta}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Workspace board */}
          <div className="bento flex min-h-0 flex-1 flex-col p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  Workspace
                </h2>
                <p className="text-xs text-muted-foreground">
                  One job per module — open what you need
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-foreground" />
                  Boards {isConnected ? stats.boardSessions : "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                  Insights {isConnected ? stats.insightsReady : "—"}
                </span>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-2 sm:grid-cols-2">
              {JOURNEY_STEPS.map((step) => {
                const Icon = step.icon;
                const live = step.status === "live" && step.href;
                const meta = moduleMeta(step.id, stats, hasAgent, isConnected);
                return (
                  <Link
                    key={step.id}
                    href={live && step.href ? step.href : "#"}
                    className={cn(
                      "group flex flex-col justify-between rounded-2xl bg-muted/50 p-4 transition-colors",
                      live
                        ? "hover:bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]"
                        : "pointer-events-none opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)]">
                        <Icon
                          className="h-4 w-4 text-foreground"
                          strokeWidth={1.75}
                        />
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[var(--brand)]" />
                    </div>
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {step.title}
                        </span>
                        <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {meta.badge}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {step.tagline}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right CTA rail */}
        <aside className="flex min-h-0 flex-col gap-3">
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <RailTile
              href="/dashboard/vault/my-files"
              icon={Upload}
              label="Ingest"
            />
            <RailTile
              href="/dashboard/advisor/talk"
              icon={MessageSquare}
              label="Talk"
            />
          </div>

          <RailLink
            href="/dashboard/vault/insights"
            icon={Sparkles}
            title="Insights"
            explainer="Categorize and summarize vault files"
          />
          <RailLink
            href="/dashboard/agent/mint"
            icon={Fingerprint}
            title="Agentic ID"
            explainer="Mint your on-chain agent identity"
          />
          <RailLink
            href="/dashboard/trading/desk"
            icon={ShieldCheck}
            title="Trading desk"
            explainer="Agents suggest · you quote & confirm"
            highlight
          />
          <RailLink
            href="/dashboard/ecosystem"
            icon={Store}
            title="Ecosystem"
            explainer="List, rent, or transfer Agentic IDs"
          />

          {(stats.tradeTraces > 0 || stats.boardSessions > 0) && isConnected ? (
            <p className="mt-auto px-1 text-center text-[10px] text-muted-foreground">
              {stats.boardSessions} sealed board
              {stats.boardSessions === 1 ? "" : "s"}
              {stats.tradeTraces > 0
                ? ` · ${stats.tradeTraces} trade trace${stats.tradeTraces === 1 ? "" : "s"}`
                : ""}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function RailTile({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Upload;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bento flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_10%,var(--surface))]"
    >
      <Icon className="h-5 w-5 text-[var(--brand)]" strokeWidth={1.75} />
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

function RailLink({
  href,
  icon: Icon,
  title,
  explainer,
  highlight = false,
}: {
  href: string;
  icon: typeof Upload;
  title: string;
  explainer: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-1 rounded-[var(--radius)] py-4 px-6 transition-colors",
        highlight
          ? "bento-brand"
          : "bento hover:bg-[color-mix(in_srgb,var(--brand)_8%,var(--surface))]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Icon
          className={cn(
            "h-5 w-5 ",
            highlight ? "text-white/90" : "text-[var(--brand)]"
          )}
          strokeWidth={1.75}
        />
        <ArrowUpRight
          className={cn(
            "h-6 w-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            highlight ? "text-white/80" : "text-muted-foreground"
          )}
        />
      </div>
      <span
        className={cn(
          "mt-2 text-sm font-semibold",
          highlight ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </span>
      <span
        className={cn(
          "text-[11px] leading-snug",
          highlight ? "text-white/75" : "text-muted-foreground"
        )}
      >
        {explainer}
      </span>
    </Link>
  );
}

function moduleMeta(
  id: string,
  stats: {
    vaultFiles: number;
    evidencePacks: number;
    boardSessions: number;
    insightsReady: number;
  },
  hasAgent: boolean,
  connected: boolean
): { badge: string } {
  if (!connected) return { badge: "Connect" };
  switch (id) {
    case "upload":
      return { badge: stats.vaultFiles > 0 ? "Ready" : "Start" };
    case "insights":
      return { badge: stats.insightsReady > 0 ? "Active" : "Optional" };
    case "chat":
      return { badge: stats.boardSessions > 0 ? "Active" : "Core" };
    case "agentic-id":
      return { badge: hasAgent ? "Owned" : "Mint" };
    case "trading":
      return { badge: "Live" };
    case "ecosystem":
      return { badge: hasAgent ? "Open" : "Locked" };
    default:
      return { badge: "Live" };
  }
}
