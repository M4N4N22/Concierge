import type { VaultFile } from "@/hooks/useUserFiles";
import { isAgentKnowledge } from "@/lib/copy/vaultTerms";
import { isEvidenceCategory } from "@/lib/evidence";

export type VaultAggregateStats = {
  total: number;
  knowledge: number;
  storedOnly: number;
  withInsights: number;
  evidencePacks: number;
  boardSessions: number;
  lastUploadAt: number | null;
  uploadsLast7Days: number;
  categoryCounts: { label: string; count: number }[];
};

export function computeVaultStats(files: VaultFile[]): VaultAggregateStats {
  const knowledge = files.filter(isAgentKnowledge);
  const storedOnly = files.filter((f) => !isAgentKnowledge(f));
  const withInsights = files.filter(
    (f) => f.insightsCID && f.insightsCID !== "0x" + "0".repeat(64)
  );
  const evidencePacks = files.filter((f) => isEvidenceCategory(f.category));
  const boardSessions = files.filter((f) => f.category === "evidence:board");

  const nowSec = Math.floor(Date.now() / 1000);
  const weekAgo = nowSec - 7 * 24 * 60 * 60;
  const uploadsLast7Days = files.filter((f) => f.timestamp >= weekAgo).length;

  const lastUploadAt =
    files.length > 0
      ? Math.max(...files.map((f) => f.timestamp))
      : null;

  const categoryMap = new Map<string, number>();
  for (const f of files) {
    const key = f.category || "unassigned";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }
  const categoryCounts = [...categoryMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    total: files.length,
    knowledge: knowledge.length,
    storedOnly: storedOnly.length,
    withInsights: withInsights.length,
    evidencePacks: evidencePacks.length,
    boardSessions: boardSessions.length,
    lastUploadAt,
    uploadsLast7Days,
    categoryCounts,
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatRelativeTime(timestampSec: number): string {
  const diff = Date.now() - timestampSec * 1000;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 86400_000 * 2) return "yesterday";
  return new Date(timestampSec * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
