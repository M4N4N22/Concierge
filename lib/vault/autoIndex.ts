import type { VaultFile } from "@/hooks/useUserFiles";
import { isAgentKnowledge, isStructuredEvidence } from "@/lib/copy/vaultTerms";

export const AUTO_INDEX_PREF_KEY = "concierge.autoIndex.v1";
export const AUTO_INDEX_QUEUE_KEY = "concierge.autoIndex.queue.v1";
export const AUTO_INDEX_PAUSE_KEY = "concierge.autoIndex.paused.v1";

export type AutoIndexPreference = {
  enabled: boolean;
  wallet: string;
};

export type IndexQueueItem = {
  rootHash: string;
  fileName: string;
  category: string;
  enqueuedAt: string;
};

export type IndexJobState = "queued" | "running" | "failed";

export type FileKnowledgeStatus =
  | "ready"
  | "indexing"
  | "stored"
  | "paused"
  | "failed";

export function loadAutoIndexPref(wallet: string | undefined): boolean {
  if (typeof window === "undefined" || !wallet) return false;
  try {
    const raw = localStorage.getItem(AUTO_INDEX_PREF_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as AutoIndexPreference;
    return (
      parsed.enabled === true &&
      parsed.wallet.toLowerCase() === wallet.toLowerCase()
    );
  } catch {
    return false;
  }
}

export function saveAutoIndexPref(wallet: string, enabled: boolean) {
  localStorage.setItem(
    AUTO_INDEX_PREF_KEY,
    JSON.stringify({ enabled, wallet: wallet.toLowerCase() })
  );
}

export function loadIndexQueue(wallet: string): IndexQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTO_INDEX_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, IndexQueueItem[]>;
    return parsed[wallet.toLowerCase()] ?? [];
  } catch {
    return [];
  }
}

export function saveIndexQueue(wallet: string, queue: IndexQueueItem[]) {
  const raw = localStorage.getItem(AUTO_INDEX_QUEUE_KEY);
  const all = raw ? (JSON.parse(raw) as Record<string, IndexQueueItem[]>) : {};
  all[wallet.toLowerCase()] = queue;
  localStorage.setItem(AUTO_INDEX_QUEUE_KEY, JSON.stringify(all));
}

export function loadIndexPaused(wallet: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(AUTO_INDEX_PAUSE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed[wallet.toLowerCase()] === true;
  } catch {
    return false;
  }
}

export function saveIndexPaused(wallet: string, paused: boolean) {
  const raw = localStorage.getItem(AUTO_INDEX_PAUSE_KEY);
  const all = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  all[wallet.toLowerCase()] = paused;
  localStorage.setItem(AUTO_INDEX_PAUSE_KEY, JSON.stringify(all));
}

/** Skip auto-read for files already usable by agents. */
export function shouldSkipAutoIndex(category: string): boolean {
  if (category.startsWith("evidence:")) return true;
  return false;
}

export function isFundError(message: string, code?: string): boolean {
  if (code === "LEDGER_UNFUNDED" || code === "LEDGER_MISSING") return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("insufficient") ||
    lower.includes("underfunded") ||
    lower.includes("balance") ||
    lower.includes("ledger") ||
    lower.includes("fund") ||
    lower.includes("deposit")
  );
}

export function truncateForIndex(content: string, max = 14_000): string {
  if (content.length <= max) return content;
  return content.slice(0, max) + "\n… [truncated for indexing]";
}

export function resolveFileKnowledgeStatus(
  file: VaultFile,
  jobState: IndexJobState | undefined,
  paused: boolean
): FileKnowledgeStatus {
  if (jobState === "running" || jobState === "queued") return "indexing";
  if (jobState === "failed") return paused ? "paused" : "failed";
  if (isAgentKnowledge(file)) return "ready";
  if (paused && file.category === "unassigned") return "paused";
  return "stored";
}

export function countStoredOnly(files: VaultFile[]): number {
  return files.filter((f) => !isAgentKnowledge(f) && !isStructuredEvidence(f)).length;
}

export const AUTO_READ_FAQ = [
  {
    id: "what",
    title: "What is Auto-read?",
    body: "After each upload, Concierge sends the file through 0G Compute to assign a category and summary so Chat can answer questions about it.",
  },
  {
    id: "cost",
    title: "What does it cost?",
    body: "Inference is paid from your 0G Compute ledger (same setup as Insights). Each file uses a small amount of OG.",
  },
  {
    id: "uploads",
    title: "Uploads without credits",
    body: "Files always save to 0G Storage even if your ledger runs out. Auto-read pauses until you fund again — then resume the queue.",
  },
  {
    id: "quick",
    title: "Quick add vs upload",
    body: "Wallet sync, CSV, and paste are structured immediately and usually skip Auto-read. Generic uploads benefit most.",
  },
  {
    id: "manual",
    title: "Manual Insights",
    body: "The Insights page still lets you batch re-analyze or fix labels. Auto-read is the hands-free default.",
  },
] as const;
