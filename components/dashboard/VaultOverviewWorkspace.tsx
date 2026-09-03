"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  FileStack,
  HardDrive,
  Layers,
  MessageSquare,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaultPageShell } from "@/components/dashboard/VaultPageShell";
import { RecentVaultFiles } from "@/components/vault/RecentVaultFiles";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useVaultStorageEstimate } from "@/hooks/useVaultStorageEstimate";
import { isAgentKnowledge, VAULT_TERMS, vaultCategoryLabel } from "@/lib/copy/vaultTerms";
import {
  computeVaultStats,
  formatBytes,
  formatRelativeTime,
} from "@/lib/vault/vaultStats";
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
          variant === "default"
            ? "text-muted-foreground"
            : "text-white/75"
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
            variant === "default"
              ? "text-muted-foreground"
              : "text-white/70"
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function VaultOverviewBody() {
  const { isConnected, chainId } = useAccount();
  const { files, loading, refetch } = useUserFiles();
  const stats = useMemo(() => computeVaultStats(files), [files]);
  const { bytes, sampled, loading: sizeLoading } = useVaultStorageEstimate(
    files,
    isConnected
  );

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  const sizeLabel =
    !isConnected || files.length === 0
      ? "—"
      : sizeLoading
        ? "…"
        : bytes != null
          ? formatBytes(bytes)
          : "—";

  const sizeDetail =
    sampled > 0 && sampled < files.length
      ? `Estimated from ${sampled} recent file${sampled === 1 ? "" : "s"}`
      : sampled > 0
        ? "Measured from stored content"
        : "Size unavailable until files are readable";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">Your vault</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            High-level view of what you have on 0G Storage — upload new files,
            browse the registry, or run Insights to turn storage into knowledge.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-full">
            <Link href="/dashboard/vault/upload">
              Upload
              <Upload className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard/vault/my-files">
              All files
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={VAULT_TERMS.stored}
          value={isConnected ? stats.total : "—"}
          detail={
            stats.lastUploadAt
              ? `Last upload ${formatRelativeTime(stats.lastUploadAt)}`
              : VAULT_TERMS.storedDetail
          }
        />
        <StatTile
          label="Est. storage"
          value={sizeLabel}
          detail={isConnected && files.length > 0 ? sizeDetail : "Connect wallet"}
          variant="ink"
        />
        <StatTile
          label={VAULT_TERMS.knowledge}
          value={isConnected ? stats.knowledge : "—"}
          detail="Ready to ask in Chat"
          variant="brand"
        />
        <StatTile
          label="Last 7 days"
          value={isConnected ? stats.uploadsLast7Days : "—"}
          detail={
            stats.storedOnly > 0
              ? `${stats.storedOnly} stored-only · run Insights`
              : "Upload activity"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="bento p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Quick actions</h2>
              <p className="text-xs text-muted-foreground">
                {loading ? "Syncing registry…" : "Jump to the next step"}
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/dashboard/vault/upload"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <Upload className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Upload files</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Store on 0G and register to your vault
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/vault/my-files"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <FileStack className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Manage files</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Search, paginate, preview registry entries
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/knowledge/feed"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <Sparkles className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Feed knowledge base</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Run AI on stored files to grow agent knowledge
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/advisor/chat"
              className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <MessageSquare className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="text-sm font-semibold">Ask Chat</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {stats.knowledge > 0
                    ? `${stats.knowledge} knowledge file${stats.knowledge === 1 ? "" : "s"} ready`
                    : "Add knowledge first"}
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bento p-5">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold">By category</h2>
              <p className="text-xs text-muted-foreground">
                {stats.total} registered file{stats.total === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          {!isConnected ? (
            <p className="text-sm text-muted-foreground">
              Connect wallet to see vault breakdown.
            </p>
          ) : stats.categoryCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No uploads yet — start on the Upload page.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {stats.categoryCounts.map(({ label, count }) => {
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
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
          {isConnected && stats.withInsights > 0 ? (
            <p className="mt-4 text-[11px] text-muted-foreground">
              {stats.withInsights} with Insights summaries ·{" "}
              {stats.evidencePacks} structured evidence pack
              {stats.evidencePacks === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>

      <RecentVaultFiles />
    </div>
  );
}

export function VaultOverviewWorkspace() {
  return (
    <VaultPageShell>
      <VaultOverviewBody />
    </VaultPageShell>
  );
}
