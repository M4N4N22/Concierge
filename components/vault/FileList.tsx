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
import { CopyHash } from "./CopyHash";
import { cn } from "@/lib/utils";
import {
  getStorageScanUrl,
  truncateHash,
} from "@/lib/explorer";
import { toast } from "sonner";

function displayName(file: VaultFile, content: string | null): string {
  if (file.category && file.category !== "unassigned") {
    return file.category.charAt(0).toUpperCase() + file.category.slice(1);
  }
  if (content && !content.includes("File not found")) {
    const firstLine = content.split("\n")[0]?.trim();
    if (firstLine && firstLine.length < 60) return firstLine;
  }
  return `Document ${truncateHash(file.rootHash, 6, 4)}`;
}

function VaultFileCard({ file, chainId }: { file: VaultFile; chainId: number }) {
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

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
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
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              file.category === "unassigned"
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {file.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
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
        <div className="border-t bg-muted/10 px-4 py-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                0G Storage hash
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-primary break-all flex-1">
                  {file.rootHash}
                </code>
                <button
                  type="button"
                  onClick={copyHash}
                  className="shrink-0 rounded-md p-1.5 hover:bg-muted text-muted-foreground"
                  aria-label="Copy hash"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <ExplorerLink
                href={getStorageScanUrl(chainId)}
                label="Verify on StorageScan"
              />
              <p className="text-[11px] text-muted-foreground">
                Preview loads in-app from 0G Storage — no download needed
              </p>
            </div>

            <div className="rounded-lg border bg-background p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Storage status
              </p>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching from 0G…
                </div>
              ) : storageAvailable ? (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Available on 0G Storage
                </p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : (
                <p className="text-sm text-amber-600">Indexing — try again shortly</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-background overflow-hidden">
            <div className="border-b bg-muted/30 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Preview</p>
            </div>
            <div className="p-3 max-h-48 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : storageAvailable ? (
                <pre className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed">
                  {content!.length > 2000
                    ? content!.slice(0, 2000) + "\n…"
                    : content}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
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

export default function FileList({ refreshToken = 0 }: { refreshToken?: number }) {
  const { files, loading, refetch } = useUserFiles();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [search, setSearch] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (isConnected) {
      refetch().then(() => setHasFetched(true));
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
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium">Connect wallet to view vault files</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your on-chain file registry is tied to your wallet address
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by hash or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading && !hasFetched ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
          <p className="text-sm">Loading your vault from 0G Chain…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">
            {search ? "No files match your search" : "No files in your vault yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? "Try a different search term"
              : "Upload documents above — they'll appear here once registered on-chain"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            {filtered.length} file{filtered.length !== 1 ? "s" : ""} in vault
            {search && ` matching "${search}"`}
          </p>
          {filtered.map((file) => (
            <VaultFileCard key={file.rootHash} file={file} chainId={chainId} />
          ))}
        </div>
      )}
    </div>
  );
}
