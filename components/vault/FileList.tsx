"use client";

import { useState, useEffect, useCallback } from "react";
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
}: {
  file: VaultFile;
  chainId: number;
  jobState?: "queued" | "running" | "failed";
  paused: boolean;
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
    <div className="overflow-hidden rounded-2xl bg-muted/45 transition-colors hover:bg-muted/70">
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

      {expanded && (
        <div className="space-y-3 border-t border-border/50 px-3.5 py-3.5">
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
}: {
  refreshToken?: number;
  compact?: boolean;
}) {
  const { files, loading, refetch } = useUserFiles();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { jobStates, paused } = useAutoIndex();
  const [search, setSearch] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (isConnected) {
      refetch({ silent: true }).then(() => setHasFetched(true));
    }
  }, [isConnected, chainId, refreshToken, refetch]);

  const filtered = files.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.rootHash.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  });

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
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-muted/40 px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
          <p className="text-sm font-medium">
            {search ? "No files match your search" : "No files in your vault yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? "Try a different search term"
              : "Upload files above — they appear here once registered on 0G"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {!compact && (
            <p className="px-1 text-xs text-muted-foreground">
              {filtered.length} file{filtered.length !== 1 ? "s" : ""} in vault
              {search && ` matching "${search}"`}
            </p>
          )}
          {filtered.map((file) => (
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
