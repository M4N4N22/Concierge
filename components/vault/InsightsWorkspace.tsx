"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useUserFiles, VaultFile } from "@/hooks/useUserFiles";
import { fetchFileContent } from "@/utils/fetchFileContent";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { truncateHash } from "@/lib/explorer";
import {
  Sparkles,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

type FileInsight = {
  category: string;
  summary: string;
  error?: string;
};

export default function InsightsWorkspace() {
  const { isConnected } = useAccount();
  const { files, loading: filesLoading, refetch } = useUserFiles();
  const { readiness } = useComputeLedgerContext();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<Record<string, FileInsight>>({});
  const [processing, setProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (isConnected) refetch();
  }, [isConnected, refetch]);

  const toggleFile = (hash: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  };

  const selectAll = () => {
    const unprocessed = files.filter((f) => !insights[f.rootHash]?.summary);
    setSelected(new Set(unprocessed.map((f) => f.rootHash)));
  };

  const computeOne = async (file: VaultFile): Promise<FileInsight> => {
    const fileContent = await fetchFileContent(file.rootHash);
    const res = await fetch("/api/computeInsights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rootHash: file.rootHash,
        fileName: `vault-${file.rootHash.slice(0, 8)}.txt`,
        content: fileContent,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Compute failed");
    }
    return { category: data.category, summary: data.summary };
  };

  const runInsights = async () => {
    if (!readiness.canCompute) {
      toast.error("Complete ledger setup and fund a provider first");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one file");
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
      }
      setProgress({ done: i + 1, total: toProcess.length });
    }

    setCurrentFile(null);
    setProcessing(false);
    setSelected(new Set());
    await refetch();
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

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
        <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium">Connect wallet to run insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gate: setup required */}
      {!readiness.canCompute && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Complete setup above first</p>
            <ul className="mt-1.5 space-y-0.5 text-muted-foreground text-xs">
              {!readiness.hasLedger && <li>→ Create your 0G Compute ledger</li>}
              {readiness.hasLedger && !readiness.hasBalance && (
                <li>→ Deposit OG into your ledger</li>
              )}
              {readiness.hasBalance && !readiness.hasFundedProvider && (
                <li>→ Fund at least one AI model provider</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Run AI insights</h2>
            <p className="text-sm text-muted-foreground">
              Select vault files — 0G Compute categorizes and summarizes each one
            </p>
          </div>
          {files.length > 0 && readiness.canCompute && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={selectAll} disabled={processing}>
                Select all
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={runInsights}
                disabled={processing || selected.size === 0}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {processing
                  ? `Analyzing ${progress.done}/${progress.total}…`
                  : `Analyze ${selected.size || ""} file${selected.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </div>

        {processing && (
          <div className="border-b bg-primary/[0.03] px-5 py-3 space-y-2">
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
              Verifying provider · inference · storing results on 0G · updating vault
            </p>
          </div>
        )}

        <div className="p-5">
          {filesLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading vault files…</span>
            </div>
          ) : files.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">No files in your vault</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Upload documents first, then return here for AI organization
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/vault/my-files">Go to Upload</Link>
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
                      "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                      selected.has(file.rootHash) && "border-primary/40 bg-primary/[0.03]",
                      hasResult || onChainCategory
                        ? "border-green-500/20"
                        : "hover:bg-muted/20"
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono text-muted-foreground">
                          {truncateHash(file.rootHash)}
                        </code>
                        {(hasResult || onChainCategory) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            {insight?.category || onChainCategory}
                          </span>
                        )}
                      </div>
                      {insight?.error ? (
                        <p className="text-sm text-red-500 mt-1">{insight.error}</p>
                      ) : insight?.summary || onChainCategory ? (
                        <p className="text-sm text-foreground mt-1.5 leading-relaxed">
                          {insight?.summary || "Insights stored on-chain"}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
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

      {/* Results by category */}
      {hasInsights && categories.length > 0 && (
        <section className="rounded-2xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3.5">
            <p className="text-sm font-medium">Organized vault</p>
            <p className="text-xs text-muted-foreground">
              Files grouped by AI-assigned category — stored on 0G & written to vault
            </p>
          </div>
          <div className="p-5">
            <Tabs defaultValue={categories[0]}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
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
                      <InsightCard key={f.rootHash} file={f} insight={insights[f.rootHash]} />
                    ))}
                </div>
              </TabsContent>

              {categories.map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {grouped[cat].map((f) => (
                      <InsightCard key={f.rootHash} file={f} insight={insights[f.rootHash]} />
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
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {category}
        </span>
        <code className="text-[10px] text-muted-foreground font-mono">
          {truncateHash(file.rootHash, 6, 4)}
        </code>
      </div>
      <p className="text-sm leading-relaxed">
        {insight?.summary || "Summary stored on 0G Storage"}
      </p>
    </div>
  );
}
