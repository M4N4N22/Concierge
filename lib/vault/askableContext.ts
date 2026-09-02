/**
 * Unified knowledge loader for Chat — structured VaultEvidence JSON
 * plus Insights summaries converted into agent-readable packs.
 */

import type { VaultFile } from "@/hooks/useUserFiles";
import {
  EVIDENCE_SCHEMA_VERSION,
  createEvidenceId,
  isEvidenceCategory,
  type VaultEvidence,
} from "@/lib/evidence";
import { isAgentKnowledge } from "@/lib/copy/vaultTerms";

const CHAT_SKIP_CATEGORIES = new Set(["evidence:board", "evidence:trade"]);

export function chatEligibleFile(file: VaultFile): boolean {
  if (CHAT_SKIP_CATEGORIES.has(file.category)) return false;
  return isAgentKnowledge(file) || file.category === "unassigned";
}

export function parseStructuredEvidence(raw: string): VaultEvidence | null {
  try {
    const parsed = JSON.parse(raw) as VaultEvidence;
    if (parsed?.id && parsed?.type && Array.isArray(parsed.facts)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

/** Build a VaultEvidence pack from an Insights summary when no JSON pack exists. */
export function evidenceFromInsightSummary(args: {
  rootHash: string;
  category: string;
  summary: string;
  title?: string;
}): VaultEvidence {
  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    id: createEvidenceId(`idx_${args.rootHash.slice(0, 8)}`),
    type: "document",
    source: "upload",
    title: args.title ?? args.category ?? "Indexed file",
    summary: args.summary,
    facts: [
      { key: "category", value: args.category },
      { key: "storageRootHash", value: args.rootHash },
      { key: "summary", value: args.summary },
    ],
    createdAt: new Date().toISOString(),
    confidence: 0.75,
  };
}

export type AskableLoadResult = {
  evidence: VaultEvidence[];
  structuredCount: number;
  indexedCount: number;
};

export async function loadAskableEvidence(args: {
  files: VaultFile[];
  fetchContent: (rootHash: string) => Promise<string>;
  limit?: number;
}): Promise<AskableLoadResult> {
  const limit = args.limit ?? 16;
  const evidence: VaultEvidence[] = [];
  let structuredCount = 0;
  let indexedCount = 0;

  const candidates = args.files
    .filter((f) => !CHAT_SKIP_CATEGORIES.has(f.category))
    .filter((f) => isAgentKnowledge(f));

  for (const file of candidates) {
    if (evidence.length >= limit) break;

    try {
      const raw = await args.fetchContent(file.rootHash);

      if (isEvidenceCategory(file.category)) {
        const pack = parseStructuredEvidence(raw);
        if (pack) {
          evidence.push(pack);
          structuredCount++;
          continue;
        }
      }

      const hasInsight =
        file.insightsCID &&
        file.insightsCID !== "" &&
        file.insightsCID !== "0x" &&
        file.insightsCID !== "0x" + "0".repeat(64);

      if (hasInsight) {
        let summary = raw;
        try {
          summary = await args.fetchContent(file.insightsCID);
        } catch {
          /* use file body if summary CID unavailable */
        }
        if (summary && !summary.includes("File not found")) {
          evidence.push(
            evidenceFromInsightSummary({
              rootHash: file.rootHash,
              category: file.category !== "unassigned" ? file.category : "document",
              summary: summary.slice(0, 4000),
              title: file.category !== "unassigned" ? file.category : undefined,
            })
          );
          indexedCount++;
        }
      }
    } catch {
      /* skip unreadable file */
    }
  }

  return { evidence, structuredCount, indexedCount };
}
