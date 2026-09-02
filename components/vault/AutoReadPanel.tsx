"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Loader2,
  PauseCircle,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComputeSetupDialog } from "@/components/compute/ComputeSetupDialog";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { useAutoIndex } from "@/components/vault/AutoIndexProvider";
import { useUserFiles } from "@/hooks/useUserFiles";
import { isStoredOnly } from "@/lib/copy/vaultTerms";
import { cn } from "@/lib/utils";

export function AutoReadPanel() {
  const { readiness, loading: ledgerLoading } = useComputeLedgerContext();
  const { files } = useUserFiles();
  const {
    autoReadEnabled,
    paused,
    pendingCount,
    processing,
    setAutoReadEnabled,
    enqueueIndex,
    resumeQueue,
  } = useAutoIndex();
  const [setupOpen, setSetupOpen] = useState(false);
  const seededRef = useRef(false);

  const enqueueStoredOnly = () => {
    for (const file of files) {
      if (!isStoredOnly(file)) continue;
      enqueueIndex({
        rootHash: file.rootHash,
        fileName: `vault-${file.rootHash.slice(0, 8)}`,
        category: file.category,
      });
    }
  };

  const enableAutoRead = () => {
    setAutoReadEnabled(true);
    enqueueStoredOnly();
  };

  /** When auto-read defaults ON (compute funded), seed stored-only files once. */
  useEffect(() => {
    if (!autoReadEnabled || !readiness.canCompute || seededRef.current) return;
    if (files.length === 0) return;
    seededRef.current = true;
    enqueueStoredOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per mount when ready
  }, [autoReadEnabled, readiness.canCompute, files.length]);

  const toggle = () => {
    if (!autoReadEnabled) {
      if (!readiness.canCompute) {
        setSetupOpen(true);
        return;
      }
      enableAutoRead();
      return;
    }
    setAutoReadEnabled(false);
    seededRef.current = false;
  };

  const onSetupClose = () => {
    setSetupOpen(false);
    if (readiness.canCompute) {
      enableAutoRead();
    }
  };

  return (
    <>
      <div className="bento flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-sm font-semibold">Auto-read uploads</h2>
            {autoReadEnabled && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  paused
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-[var(--brand)]"
                )}
              >
                {paused ? "Paused" : "On"}
              </span>
            )}
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            Like Drive sync for knowledge — new uploads get categorized so Chat
            can use them. On by default when compute is funded. Files always
            save; if your ledger runs out, indexing pauses until you fund again.
          </p>
          {autoReadEnabled && paused && (
            <p className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
              <PauseCircle className="h-3.5 w-3.5 shrink-0" />
              Auto-read paused — add OG to your compute ledger, then resume.
            </p>
          )}
          {autoReadEnabled && pendingCount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {processing
                ? "Indexing in progress…"
                : `${pendingCount} file${pendingCount === 1 ? "" : "s"} waiting to index`}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {autoReadEnabled && (paused || pendingCount > 0) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={!readiness.canCompute || processing}
              onClick={resumeQueue}
            >
              {processing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              Resume
            </Button>
          )}
          {!readiness.canCompute && !ledgerLoading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setSetupOpen(true)}
            >
              Set up compute
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className={cn(
              "rounded-full min-w-[7.5rem]",
              autoReadEnabled && "bg-muted text-foreground hover:bg-muted/80"
            )}
            variant={autoReadEnabled ? "secondary" : "default"}
            disabled={ledgerLoading}
            onClick={toggle}
          >
            {ledgerLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : autoReadEnabled ? (
              "Turn off"
            ) : (
              "Turn on"
            )}
          </Button>
        </div>
      </div>

      {!readiness.canCompute && !ledgerLoading && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Auto-read needs a compute ledger, OG balance, and a funded provider.{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => setSetupOpen(true)}
            >
              Set up first
            </button>{" "}
            or use{" "}
            <Link
              href="/dashboard/vault/insights"
              className="font-semibold underline underline-offset-2"
            >
              manual Insights
            </Link>
            .
          </p>
        </div>
      )}

      <ComputeSetupDialog
        open={setupOpen}
        onClose={onSetupClose}
        title="Set up compute for Auto-read"
        message="Create your ledger, deposit OG, and fund a provider. Auto-read uses the same credits as Insights and Chat agents."
      />
    </>
  );
}

export function FileKnowledgeBadge({
  status,
}: {
  status: "ready" | "indexing" | "stored" | "paused" | "failed";
}) {
  const styles = {
    ready:
      "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]",
    indexing:
      "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-[var(--brand)]",
    stored: "bg-[var(--surface)] text-muted-foreground",
    paused:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  };
  const labels = {
    ready: "Ready to ask",
    indexing: "Indexing…",
    stored: "Stored only",
    paused: "Index paused",
    failed: "Index failed",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
