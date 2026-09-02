/**
 * User-facing vault terminology (two layers).
 *
 * INTERNAL: code still uses `evidence:*` categories and VaultEvidence JSON.
 *
 * PRODUCT MODEL:
 * 1. **Stored files** — anything on 0G + your vault registry (like Drive).
 * 2. **Agent knowledge** — files agents can actually use (structured facts,
 *    or Insights category + summary). Raw PDFs/images are stored only until
 *    you structure them (Quick add) or run Insights.
 */

import { isEvidenceCategory } from "@/lib/evidence";
import type { VaultFile } from "@/hooks/useUserFiles";

export const VAULT_TERMS = {
  /** Layer 1 — everything in the vault */
  stored: "Stored files",
  storedSingular: "Stored file",
  storedDetail: "Saved on 0G Storage and listed in your vault — like Drive.",

  /** Layer 2 — agents can read / reason over these */
  knowledge: "Agent knowledge",
  knowledgeSingular: "Knowledge file",
  knowledgeDetail:
    "Structured or summarized so Chat, Insights, and agents can use them — not just stored as-is.",

  /** Still only layer 1 */
  notKnowledgeYet: "Not in agent knowledge yet",
  notKnowledgeHint: "Upload only — run Insights or use Quick add to make it agent-usable.",

  /** One-line explainer for Vault header */
  twoLayerExplainer:
    "Every upload is stored on 0G. Agent knowledge is the subset that is structured, categorized, or summarized so Concierge can actually use it.",

  /** Quick add vs file upload */
  quickAddDetail:
    "Wallet sync, CSV, or paste — saved on 0G and structured immediately so Chat can read them (no Insights step needed).",
  fileUploadDetail:
    "Any file type — stored on 0G. Turn on Auto-read to index new uploads, or run Insights manually.",

  emptyKnowledge: "No agent knowledge yet",
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  unassigned: "Stored only",
  wallet: "Wallet sync",
  board: "Chat save",
  trade: "Trade record",
  document: "Document",
  briefing: "Briefing",
  spend: "Spending",
  tx: "Transaction",
  travel: "Travel",
  subscription: "Subscription",
  contract: "Contract",
};

function hasInsights(file: VaultFile): boolean {
  const cid = file.insightsCID;
  if (!cid || cid === "" || cid === "0x") return false;
  if (cid === "0x" + "0".repeat(64)) return false;
  return true;
}

/** Structured evidence JSON (wallet, csv, briefing, chat/trade outputs, etc.) */
export function isStructuredEvidence(file: VaultFile): boolean {
  return isEvidenceCategory(file.category);
}

/**
 * Files agents can actually consume today:
 * - Structured evidence (Chat loads these), OR
 * - Insights-enriched (category + summary on registry; Learning/Recommendations)
 */
export function isAgentKnowledge(file: VaultFile): boolean {
  if (isStructuredEvidence(file)) return true;
  if (hasInsights(file)) return true;
  return file.category !== "unassigned" && file.category !== "";
}

export function isStoredOnly(file: VaultFile): boolean {
  return !isAgentKnowledge(file);
}

/** Human label for an on-chain vault category string. */
export function vaultCategoryLabel(category: string): string {
  if (category === "unassigned") return VAULT_TERMS.notKnowledgeYet;
  if (category.startsWith("evidence:")) {
    const type = category.slice("evidence:".length);
    return CATEGORY_LABELS[type] ?? "Agent knowledge";
  }
  return category;
}

export function agentKnowledgeCountLabel(count: number): string {
  return count === 1 ? VAULT_TERMS.knowledgeSingular : VAULT_TERMS.knowledge;
}
