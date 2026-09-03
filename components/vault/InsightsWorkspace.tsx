"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { useUserFiles, VaultFile } from "@/hooks/useUserFiles";
import { fetchFileContent } from "@/utils/fetchFileContent";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { useAddToVault } from "@/hooks/useAddToVault";
import { runInsightsJob } from "@/lib/vault/runInsightsJob";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useComputeQuota } from "@/hooks/useComputeQuota";
import { cn } from "@/lib/utils";
import { truncateHash } from "@/lib/explorer";
import {
  Sparkles,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

type FileInsight = {
  category: string;
  summary: string;
  error?: string;
};

export default function InsightsWorkspace() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { files, loading: filesLoading, refetch } = useUserFiles();
  const { readiness } = useComputeLedgerContext();
  const { updateInsights } = useAddToVault();
  const {
    quota: feedQuota,
    loading: feedQuotaLoading,
    refresh: refreshFeedQuota,
    isExhausted: feedQuotaExhausted,
  } = useComputeQuota(readiness.operatorSubsidized, "feed");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<Record<string, FileInsight>>({});
  const [processing, setProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, refetch]);

  const toggleFile = (hash: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  };

  const isSelectable = (file: VaultFile) => {
    const insight = insights[file.rootHash];
    const hasResult = insight?.summary && !insight.error;
    const onChainCategory = file.category !== "unassigned" ? file.category : null;
    return !hasResult && !onChainCategory;
  };

  const selectableFiles = files.filter(isSelectable);
  const allSelected =
    selectableFiles.length > 0 &&
    selectableFiles.every((f) => selected.has(f.rootHash));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(selectableFiles.map((f) => f.rootHash)));
  };

  const computeOne = async (file: VaultFile): Promise<FileInsight> => {
    const fileContent = await fetchFileContent(file.rootHash);
    const result = await runInsightsJob(
      {
        rootHash: file.rootHash,
        fileName: `vault-${file.rootHash.slice(0, 8)}.txt`,
        content: fileContent,
        chainId,
        wallet: address,
      },
      updateInsights
    );
    return { category: result.category, summary: result.summary };
  };

  const runInsights = async () => {
    if (!readiness.canCompute) {
      toast.error("Complete compute setup on the Compute page first");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one file");
      return;
    }
    if (
      readiness.operatorSubsidized &&
      feedQuota &&
      selected.size > feedQuota.remaining
    ) {
      toast.error(
        `Only ${feedQuota.remaining} feed action${feedQuota.remaining === 1 ? "" : "s"} left this week — select fewer files or top up on Compute.`
      );
      return;
    }
    if (readiness.operatorSubsidized && feedQuotaExhausted) {
      toast.error("Weekly feed limit reached — top up on the Compute page.");
      return;
    }

    const toProcess = files.filter((f) => selected.has(f.rootHash));
    setProcessing(true);
    setProgress({ done: 0, total: toProcess.length });

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      setCurrentFile(file.rootHash);
      try {
        const result = await computeOne(file);
        setInsights((prev) => ({ ...prev, [file.rootHash]: result }));
        toast.success(`Insights ready for ${truncateHash(file.rootHash)}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed";
        setInsights((prev) => ({
          ...prev,
          [file.rootHash]: { category: "error", summary: "", error: message },
        }));
        toast.error(message);
        if (message.toLowerCase().includes("weekly free feed limit")) {
          break;
        }
      }
      setProgress({ done: i + 1, total: toProcess.length });
    }

    setCurrentFile(null);
    setProcessing(false);
    setSelected(new Set());
    await refetch({ silent: true });
    void refreshFeedQuota();
  };

  const grouped = files.reduce<Record<string, VaultFile[]>>((acc, file) => {
    const cat =
      insights[file.rootHash]?.category ||
      (file.category !== "unassigned" ? file.category : null) ||
      "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(file);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();
  const hasInsights = Object.values(insights).some((i) => i.summary && !i.error);

  const feedPctRemaining =
    feedQuota && feedQuota.limit > 0
      ? feedQuota.remaining / feedQuota.limit
      : null;
  const feedQuotaLow =
    feedPctRemaining != null && feedPctRemaining > 0 && feedPctRemaining <= 0.15;

  if (!isConnected) {
    return (
      <div className="bento px-6 py-12 text-center">
        <Sparkles className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
        <p className="text-sm font-medium">Connect wallet to feed files</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!readiness.canCompute && (
        <div className="flex items-start gap-3 rounded-[var(--radius)] bg-amber-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium">Compute not ready</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open the{" "}
              <Link href="/dashboard/knowledge/compute" className="font-medium text-[var(--brand)] underline-offset-2 hover:underline">
                Compute page
              </Link>{" "}
              to finish setup before feeding files.
            </p>
          </div>
        </div>
      )}

      <section className="bento overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Feed vault files</h2>
            <p className="text-xs text-muted-foreground">
              Select stored uploads — 0G Compute categorizes and summarizes each one for your knowledge base
              {readiness.operatorSubsidized && selectableFiles.length > 0 ? (
                <> · {selectableFiles.length} selectable</>
              ) : null}
            </p>
            {readiness.operatorSubsidized && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1">
                <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {feedQuotaLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : feedQuota ? (
                  <>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          feedQuotaExhausted
                            ? "bg-destructive"
                            : feedQuotaLow
                              ? "bg-amber-500"
                              : "bg-[var(--brand)]"
                        )}
                        style={{
                          width: `${Math.max(0, Math.min(100, (feedPctRemaining ?? 0) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                      {feedQuota.remaining}/{feedQuota.limit} feeds left this week
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Feed quota
                  </span>
                )}
              </div>
            )}
          </div>
          {files.length > 0 && readiness.canCompute && (
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                disabled={processing || selectableFiles.length === 0}
              >
                {allSelected ? "Clear selection" : "Select all"}
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={runInsights}
                disabled={
                  processing ||
                  selected.size === 0 ||
                  (readiness.operatorSubsidized && feedQuotaExhausted)
                }
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {processing
                  ? `Analyzing ${progress.done}/${progress.total}…`
                  : selected.size > 0 &&
                      readiness.operatorSubsidized &&
                      feedQuota
                    ? `Analyze ${selected.size} file${selected.size !== 1 ? "s" : ""} (${selected.size} of ${feedQuota.remaining} left)`
                    : `Analyze ${selected.size || ""} file${selected.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </div>

        {processing && (
          <div className="space-y-2 border-t border-border/50 bg-[color-mix(in_srgb,var(--brand)_5%,transparent)] px-5 py-3">
            <div className="flex justify-between text-xs">
              <span className="font-medium">
                {currentFile
                  ? `Processing ${truncateHash(currentFile)}`
                  : "Running 0G Compute inference…"}
              </span>
              <span className="text-muted-foreground">
                {progress.done}/{progress.total}
              </span>
            </div>
            <Progress
              value={
                progress.total
                  ? Math.round((progress.done / progress.total) * 100)
                  : 0
              }
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground">
              Verifying provider · inference · storing on 0G · updating vault
            </p>
          </div>
        )}

        <div className="border-t border-border/50 px-5 py-4">
          {filesLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading vault files…</span>
            </div>
          ) : files.length === 0 ? (
            <div className="rounded-2xl bg-muted/40 px-6 py-10 text-center">
              <Upload className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">No files in your vault</p>
              <p className="mb-4 mt-1 text-xs text-muted-foreground">
                Add evidence first, then return here to organize
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/vault/upload">Go to Upload</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => {
                const insight = insights[file.rootHash];
                const hasResult = insight?.summary && !insight.error;
                const onChainCategory =
                  file.category !== "unassigned" ? file.category : null;

                return (
                  <div
                    key={file.rootHash}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl bg-muted/45 p-4 transition-colors",
                      selected.has(file.rootHash) &&
                        "bg-[color-mix(in_srgb,var(--brand)_10%,var(--surface))]",
                      (hasResult || onChainCategory) &&
                        "bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))]"
                    )}
                  >
                    {readiness.canCompute && !hasResult && !onChainCategory && (
                      <Checkbox
                        checked={selected.has(file.rootHash)}
                        onCheckedChange={() => toggleFile(file.rootHash)}
                        disabled={processing}
                        className="mt-1"
                      />
                    )}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand)]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-xs text-muted-foreground">
                          {truncateHash(file.rootHash)}
                        </code>
                        {(hasResult || onChainCategory) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--success)_14%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--success)]">
                            <CheckCircle2 className="h-3 w-3" />
                            {insight?.category || onChainCategory}
                          </span>
                        )}
                      </div>
                      {insight?.error ? (
                        <p className="mt-1 text-sm text-[var(--danger)]">
                          {insight.error}
                        </p>
                      ) : insight?.summary || onChainCategory ? (
                        <p className="mt-1.5 text-sm leading-relaxed">
                          {insight?.summary || "Insights stored on-chain"}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Not yet analyzed — select and run insights
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {hasInsights && categories.length > 0 && (
        <section className="bento overflow-hidden">
          <div className="px-5 py-4">
            <p className="text-sm font-semibold">Knowledge base by category</p>
            <p className="text-xs text-muted-foreground">
              Grouped after feeding — stored on 0G and written to the registry
            </p>
          </div>
          <div className="border-t border-border/50 px-5 py-4">
            <Tabs defaultValue={categories[0]}>
              <TabsList className="flex h-auto flex-wrap gap-1 rounded-full bg-muted p-1">
                <TabsTrigger value="all" className="rounded-full text-xs">
                  All
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-full text-xs"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {files
                    .filter(
                      (f) =>
                        insights[f.rootHash]?.summary ||
                        f.category !== "unassigned"
                    )
                    .map((f) => (
                      <InsightCard
                        key={f.rootHash}
                        file={f}
                        insight={insights[f.rootHash]}
                      />
                    ))}
                </div>
              </TabsContent>

              {categories.map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {grouped[cat].map((f) => (
                      <InsightCard
                        key={f.rootHash}
                        file={f}
                        insight={insights[f.rootHash]}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>
      )}
    </div>
  );
}

function InsightCard({
  file,
  insight,
}: {
  file: VaultFile;
  insight?: FileInsight;
}) {
  const category =
    insight?.category || (file.category !== "unassigned" ? file.category : "—");

  return (
    <div className="rounded-2xl bg-muted/45 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold     text-[var(--brand)]">
          {category}
        </span>
        <code className="font-mono text-[10px] text-muted-foreground">
          {truncateHash(file.rootHash, 6, 4)}
        </code>
      </div>
      <p className="text-sm leading-relaxed">
        {insight?.summary || "Summary stored on 0G Storage"}
      </p>
    </div>
  );
}
