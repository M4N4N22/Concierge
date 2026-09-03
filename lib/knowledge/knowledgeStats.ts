import type { VaultFile } from "@/hooks/useUserFiles";
import { isAgentKnowledge } from "@/lib/copy/vaultTerms";
import { isEvidenceCategory } from "@/lib/evidence";

export type KnowledgeBaseStats = {
  totalVaultFiles: number;
  knowledgeFiles: number;
  storedOnly: number;
  withInsightsCid: number;
  evidencePacks: number;
  unlabeled: number;
  categories: { label: string; count: number }[];
};

export function computeKnowledgeStats(files: VaultFile[]): KnowledgeBaseStats {
  const knowledgeFiles = files.filter(isAgentKnowledge);
  const storedOnly = files.filter((f) => !isAgentKnowledge(f));
  const withInsightsCid = files.filter(
    (f) => f.insightsCID && f.insightsCID !== "0x" + "0".repeat(64)
  );
  const evidencePacks = files.filter((f) => isEvidenceCategory(f.category));
  const unlabeled = files.filter((f) => f.category === "unassigned");

  const categoryMap = new Map<string, number>();
  for (const f of knowledgeFiles) {
    const key = f.category || "unassigned";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }
  const categories = [...categoryMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalVaultFiles: files.length,
    knowledgeFiles: knowledgeFiles.length,
    storedOnly: storedOnly.length,
    withInsightsCid: withInsightsCid.length,
    evidencePacks: evidencePacks.length,
    unlabeled: unlabeled.length,
    categories,
  };
}

export const KNOWLEDGE_BASE_COPY = {
  title: "Knowledge base",
  tagline: "Turn stored files into agent knowledge",
  feedTitle: "Feed vault files",
  feedDetail:
    "Select stored uploads and run 0G Compute to categorize and summarize — results land on-chain and in storage.",
  computeTitle: "0G Compute",
  computeDetail:
    "Monitor operator pool status, daily quota, or set up your own ledger for advanced use.",
} as const;
