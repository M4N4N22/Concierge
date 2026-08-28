import type { VaultEvidence } from "@/lib/evidence";

export type BoardAgentRole = "analyst" | "risk" | "security" | "chair";

export type BoardVerdict = "approve" | "reject" | "revise" | "abstain";

export type GuardStatus = "pass" | "block" | "review";

export type GuardSeal = {
  status: GuardStatus;
  sealed: true;
  allowedActions: string[];
  blockedActions: string[];
  reasons: string[];
  /** keccak256 fingerprint of sealed payload — TEE-style lineage stand-in */
  sealHash: `0x${string}`;
  sealedAt: string;
};

export type BoardTurn = {
  role: BoardAgentRole;
  name: string;
  stance: BoardVerdict;
  argument: string;
  concerns: string[];
  citations: string[];
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
  agentTokenId?: string;
  chairWallet?: string;
  guard?: GuardSeal;
  transcriptRootHash?: string;
  boundToAgent?: boolean;
};

export type BoardSessionRequest = {
  question: string;
  evidence: VaultEvidence[];
  mode?: "auto" | "live" | "fast" | "fallback";
  agentTokenId?: string;
  wallet?: string;
};

export function createBoardSessionId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `board_${Date.now()}_${rand}`;
}
