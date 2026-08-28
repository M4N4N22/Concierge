import type { VaultEvidence } from "@/lib/evidence";

export type BoardAgentRole = "analyst" | "risk" | "security" | "chair";

export type BoardVerdict = "approve" | "reject" | "revise" | "abstain";

export type BoardTurn = {
  role: BoardAgentRole;
  name: string;
  stance: BoardVerdict;
  argument: string;
  concerns: string[];
  citations: string[]; // evidence ids or fact keys
};

export type BoardConsensus = {
  verdict: BoardVerdict;
  summary: string;
  actions: string[];
  dissent: string[];
  confidence: number;
};

export type BoardSession = {
  schemaVersion: 1;
  id: string;
  question: string;
  evidenceIds: string[];
  turns: BoardTurn[];
  consensus: BoardConsensus;
  computeMode: "live" | "fast" | "fallback";
  modelNotes?: string;
  createdAt: string;
};

export type BoardSessionRequest = {
  question: string;
  evidence: VaultEvidence[];
  /** live = sequential agents; fast = one multi-role call; auto tries live then falls back */
  mode?: "auto" | "live" | "fast" | "fallback";
};

export function createBoardSessionId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `board_${Date.now()}_${rand}`;
}
