"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  BrainCircuit,
  Cpu,
  Layers,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgePageShell } from "@/components/dashboard/KnowledgePageShell";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { useUserFiles } from "@/hooks/useUserFiles";
import { VAULT_TERMS, vaultCategoryLabel } from "@/lib/copy/vaultTerms";
import {
  computeKnowledgeStats,
  KNOWLEDGE_BASE_COPY,
} from "@/lib/knowledge/knowledgeStats";
import { cn } from "@/lib/utils";

function StatTile({
  label,
  value,
  detail,
  variant = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  variant?: "default" | "brand" | "ink";
}) {
  return (
    <div
      className={cn(
        "bento p-5",
        variant === "brand" && "bento-brand",
        variant === "ink" && "bento-ink"
      )}
    >
      <span
        className={cn(
          "text-xs font-medium",
          variant === "default" ? "text-muted-foreground" : "text-white/75"
        )}
      >
        {label}
      </span>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tabular-nums",
          variant !== "default" && "text-white"
        )}
      >
        {value}
      </p>
      {detail ? (
        <p
          className={cn(
            "mt-1 text-[11px]",
            variant === "default" ? "text-muted-foreground" : "text-white/70"
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function KnowledgeOverviewBody() {
  const { isConnected, chainId } = useAccount();
  const { files, refetch } = useUserFiles();
  const { readiness } = useComputeLedgerContext();
  const stats = useMemo(() => computeKnowledgeStats(files), [files]);

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  const computeStatus = !isConnected
    ? "—"
    : readiness.canCompute
      ? "Ready"
      : readiness.operatorSubsidized
        ? "Pool offline"
        : "Setup needed";

  const primaryCta =
    stats.knowledgeFiles > 0
      ? { href: "/dashboard/advisor/chat?intent=vault", label: "Ask your vault" }
      : stats.totalVaultFiles > 0
        ? { href: "/dashboard/knowledge/feed", label: "Feed files" }
        : { href: "/dashboard/vault/upload", label: "Upload files first" };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {KNOWLEDGE_BASE_COPY.title}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {KNOWLEDGE_BASE_COPY.tagline}. Feed vault uploads through 0G Compute
            so Concierge can answer from categories and summaries — not raw
            files alone.
          </p>
        </div>
        <Button asChild className="rounded-full px-5">
          <Link href={primaryCta.href}>
            {primaryCta.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={VAULT_TERMS.knowledge}
          value={isConnected ? stats.knowledgeFiles : "—"}
          detail="Ready for Chat and Learning"
          variant="brand"
        />
        <StatTile
          label="Stored only"
          value={isConnected ? stats.storedOnly : "—"}
          detail={
            stats.storedOnly > 0
              ? `${stats.storedOnly} waiting to be fed`
              : "All vault files are knowledge or none yet"
          }
        />
        <StatTile
          label="With summaries"
          value={isConnected ? stats.withInsightsCid : "—"}
          detail="Insights CIDs on-chain"
          variant="ink"
        />
        <StatTile
          label="Compute"
          value={computeStatus}
          detail={
            readiness.operatorSubsidized && readiness.canCompute
              ? "Concierge operator pool"
              : readiness.canCompute
                ? "Ledger + provider ready"
                : "Open Compute to finish setup"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="bento p-5">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Build and maintain what Concierge understands
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/dashboard/knowledge/feed"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <BrainCircuit className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Feed files</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Run AI on stored uploads to grow the knowledge base
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/knowledge/compute"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <Cpu className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Compute account</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Monitor quota, top up, or BYO ledger
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/vault/upload"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <Sparkles className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Add vault files</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Upload or Quick add before feeding
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/advisor/chat?intent=vault"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <MessageSquare className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Ask Chat</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {stats.knowledgeFiles > 0
                    ? `${stats.knowledgeFiles} knowledge file${stats.knowledgeFiles === 1 ? "" : "s"}`
                    : "Feed files first"}
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bento p-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold">Knowledge by category</h2>
              <p className="text-xs text-muted-foreground">
                {stats.evidencePacks} structured pack
                {stats.evidencePacks === 1 ? "" : "s"} ·{" "}
                {stats.unlabeled} unlabeled
              </p>
            </div>
          </div>
          {!isConnected ? (
            <p className="text-sm text-muted-foreground">
              Connect wallet to see breakdown.
            </p>
          ) : stats.categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agent knowledge yet — feed files from your vault.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {stats.categories.map(({ label, count }) => {
                const pct =
                  stats.knowledgeFiles > 0
                    ? (count / stats.knowledgeFiles) * 100
                    : 0;
                return (
                  <li key={label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {vaultCategoryLabel(label)}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[var(--brand)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function KnowledgeOverviewWorkspace() {
  return (
    <KnowledgePageShell>
      <KnowledgeOverviewBody />
    </KnowledgePageShell>
  );
}
