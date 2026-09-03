"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { useUserFiles, VaultFile } from "@/hooks/useUserFiles";
import { useAccount, useChainId } from "wagmi";
import { usefetchFileContent } from "@/hooks/useFileContent";
import {
  Loader2,
  FileText,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  HardDrive,
  Blocks,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExplorerLink } from "./ExplorerLink";
import { cn } from "@/lib/utils";
import { getStorageScanUrl, truncateHash } from "@/lib/explorer";
import { toast } from "sonner";
import { isEvidenceCategory } from "@/lib/evidence";
import { vaultCategoryLabel } from "@/lib/copy/vaultTerms";
import { resolveFileKnowledgeStatus } from "@/lib/vault/autoIndex";
import { useAutoIndex } from "@/components/vault/AutoIndexProvider";
import { FileKnowledgeBadge } from "@/components/vault/AutoReadPanel";

function parseEvidenceTitle(content: string | null): string | null {
  if (!content || content.includes("File not found")) return null;
  try {
    const parsed = JSON.parse(content) as {
      title?: string;
      type?: string;
      question?: string;
      consensus?: { verdict?: string };
    };
    if (parsed?.title) return parsed.title;
    if (parsed?.consensus?.verdict && parsed?.question) {
      return `Board · ${parsed.consensus.verdict} · ${parsed.question.slice(0, 40)}`;
    }
  } catch {
    // not JSON
  }
  return null;
}

function displayName(file: VaultFile, content: string | null): string {
  const evidenceTitle = parseEvidenceTitle(content);
  if (evidenceTitle) return evidenceTitle;

  if (isEvidenceCategory(file.category)) {
    return vaultCategoryLabel(file.category);
  }
  if (file.category && file.category !== "unassigned") {
    return file.category.charAt(0).toUpperCase() + file.category.slice(1);
  }
  if (content && !content.includes("File not found")) {
    const firstLine = content.split("\n")[0]?.trim();
    if (firstLine && firstLine.length < 60) return firstLine;
  }
  return `Document ${truncateHash(file.rootHash, 6, 4)}`;
}

function VaultFileCard({
  file,
  chainId,
  jobState,
  paused,
  embedded = false,
}: {
  file: VaultFile;
  chainId: number;
  jobState?: "queued" | "running" | "failed";
  paused: boolean;
  embedded?: boolean;
}) {
  const { fetchFileContent } = usefetchFileContent();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadContent = useCallback(async () => {
    if (content !== null || loading) return;
    setLoading(true);
    setError(null);
    try {
      const text = await fetchFileContent(file.rootHash);
      setContent(text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [content, loading, fetchFileContent, file.rootHash]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadContent();
  };

  useEffect(() => {
    if (embedded) void loadContent();
  }, [embedded, loadContent]);

  const copyHash = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(file.rootHash);
    setCopied(true);
    toast.success("Hash copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const storageAvailable =
    content && !content.includes("File not found") && !error;
  const title = displayName(file, content);
  const knowledgeStatus = resolveFileKnowledgeStatus(
    file,
    jobState,
    paused
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-muted/45 transition-colors hover:bg-muted/70",
        embedded && "rounded-xl bg-transparent hover:bg-transparent"
      )}
    >
      {!embedded ? (
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand)]">
          <FileText className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {new Date(file.timestamp * 1000).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <FileKnowledgeBadge status={knowledgeStatus} />
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              file.category === "unassigned"
                ? "bg-[var(--surface)] text-muted-foreground"
                : isEvidenceCategory(file.category)
                  ? "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-[var(--brand)]"
                  : "bg-[var(--surface)] text-foreground"
            )}
          >
            {vaultCategoryLabel(file.category)}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--success)]">
            <Blocks className="h-3 w-3" />
            On-chain
          </span>
        </div>

        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      ) : (
        <div className="px-1 py-1">
          <p className="text-xs font-medium text-muted-foreground">File details</p>
        </div>
      )}

      {(embedded || expanded) && (
        <div
          className={cn(
            "space-y-3 border-t border-border/50 px-3.5 py-3.5",
            embedded && "border-t-0 px-0"
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 rounded-2xl bg-[var(--surface)] p-3">
              <p className="flex items-center gap-1 text-[10px] font-semibold     text-muted-foreground">
                <HardDrive className="h-3 w-3" />
                0G Storage hash
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-xs text-[var(--brand)]">
                  {file.rootHash}
                </code>
                <button
                  type="button"
                  onClick={copyHash}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Copy hash"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <ExplorerLink
                href={getStorageScanUrl(chainId)}
                label="Verify on StorageScan"
              />
            </div>

            <div className="space-y-1.5 rounded-2xl bg-[var(--surface)] p-3">
              <p className="text-[10px] font-semibold     text-muted-foreground">
                Storage status
              </p>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching from 0G…
                </div>
              ) : storageAvailable ? (
                <p className="text-sm font-medium text-[var(--success)]">
                  Available on 0G Storage
                </p>
              ) : error ? (
                <p className="text-sm text-[var(--danger)]">{error}</p>
              ) : (
                <p className="text-sm text-amber-600">
                  Indexing — try again shortly
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Preview loads in-app — no download needed
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Preview</p>
            </div>
            <div className="max-h-48 overflow-auto px-3 pb-3">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : storageAvailable ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
                  {content!.length > 2000
                    ? content!.slice(0, 2000) + "\n…"
                    : content}
                </pre>
              ) : (
                <p className="py-4 text-center text-sm italic text-muted-foreground">
                  {error ? "Could not load preview" : "Preview not available yet"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FileList({
  refreshToken = 0,
  compact = false,
  paginated = false,
  pageSize = 10,
  view = "cards",
  limit,
}: {
  refreshToken?: number;
  compact?: boolean;
  paginated?: boolean;
  pageSize?: number;
  view?: "cards" | "table";
  /** Show only the newest N files (for compact strips). */
  limit?: number;
}) {
  const { files, loading, refetch } = useUserFiles();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { jobStates, paused } = useAutoIndex();
  const [search, setSearch] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      refetch({ silent: true }).then(() => setHasFetched(true));
    }
  }, [isConnected, chainId, refreshToken, refetch]);

  const filtered = files
    .filter((f) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        f.rootHash.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const limited = limit != null ? filtered.slice(0, limit) : filtered;
  const totalPages = paginated
    ? Math.max(1, Math.ceil(limited.length / pageSize))
    : 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = paginated
    ? limited.slice((safePage - 1) * pageSize, safePage * pageSize)
    : limited;

  useEffect(() => {
    setPage(1);
  }, [search, limit, pageSize]);

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-muted/40 px-6 py-12 text-center">
        <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
        <p className="text-sm font-medium">Connect wallet to view vault files</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your on-chain registry is tied to this wallet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2.5")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by hash or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-full pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loading}
          className="shrink-0 gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading && !hasFetched ? (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
          <Loader2 className="mb-3 h-7 w-7 animate-spin text-[var(--brand)]" />
          <p className="text-sm">Loading vault from 0G Chain…</p>
        </div>
      ) : limited.length === 0 ? (
        <div className="rounded-2xl bg-muted/40 px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
          <p className="text-sm font-medium">
            {search ? "No files match your search" : "No files in your vault yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? "Try a different search term"
              : "Upload files on the Upload page — they appear here once registered on 0G"}
          </p>
        </div>
      ) : view === "table" ? (
        <div className="space-y-3">
          {!compact && (
            <p className="px-1 text-xs text-muted-foreground">
              {limited.length} file{limited.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
              {paginated
                ? ` · page ${safePage} of ${totalPages}`
                : null}
            </p>
          )}
          <div className="overflow-x-auto rounded-2xl border border-border/40">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">File</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                    Insights
                  </th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Uploaded</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((file) => {
                  const knowledgeStatus = resolveFileKnowledgeStatus(
                    file,
                    jobStates[file.rootHash],
                    paused
                  );
                  const expanded = expandedHash === file.rootHash;
                  const hasInsights =
                    file.insightsCID &&
                    file.insightsCID !== "0x" + "0".repeat(64);
                  return (
                    <Fragment key={file.rootHash}>
                      <tr
                        key={file.rootHash}
                        className="border-t border-border/50 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium">
                          {truncateHash(file.rootHash, 10, 8)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {vaultCategoryLabel(file.category)}
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          {hasInsights ? (
                            <span className="text-[var(--success)]">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <FileKnowledgeBadge status={knowledgeStatus} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(file.timestamp * 1000).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedHash(expanded ? null : file.rootHash)
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--brand)] hover:bg-muted/60"
                          >
                            {expanded ? "Hide" : "Details"}
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr key={`${file.rootHash}-detail`} className="border-t border-border/40 bg-muted/10">
                          <td colSpan={6} className="px-4 py-3">
                            <VaultFileCard
                              file={file}
                              chainId={chainId}
                              jobState={jobStates[file.rootHash]}
                              paused={paused}
                              embedded
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {paginated && totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[11px] text-muted-foreground">
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, limited.length)} of{" "}
                {limited.length}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {!compact && (
            <p className="px-1 text-xs text-muted-foreground">
              {limited.length} file{limited.length !== 1 ? "s" : ""} in vault
              {search && ` matching "${search}"`}
            </p>
          )}
          {pageItems.map((file) => (
            <VaultFileCard
              key={file.rootHash}
              file={file}
              chainId={chainId}
              jobState={jobStates[file.rootHash]}
              paused={paused}
            />
          ))}
        </div>
      )}
    </div>
  );
}
