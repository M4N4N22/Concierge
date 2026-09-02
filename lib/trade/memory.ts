/**
 * Trade decision memory for 0G Storage — audit trail + Agentic ID memory updates.
 * Pattern from NerOS (mutable memory CID) and Croisette.cc (manifest on Storage).
 */

import type { ExecutionGate, AgentVote, TradeConsensus } from "./orchestrator";
import { createEvidenceId, type VaultEvidence } from "@/lib/evidence";
import type { TradeProposal, TradeSide } from "./types";

export const TRADE_MEMORY_SCHEMA = 1 as const;

export type TradeMemoryRecord = {
  schemaVersion: typeof TRADE_MEMORY_SCHEMA;
  type: "concierge.trade.memory";
  sessionId: string;
  proposalId: string;
  agentTokenId?: string;
  wallet?: string;
  chainId?: number;
  pair: string;
  side: TradeSide;
  size: number;
  sizeIsQuote: boolean;
  confidence: number;
  agreement: number;
  gate: ExecutionGate;
  rationale: string;
  votes: AgentVote[];
  guardSealHash?: `0x${string}`;
  createdAt: string;
};

export function buildTradeMemoryRecord(args: {
  sessionId: string;
  proposal: TradeProposal;
  consensus: TradeConsensus;
  gate: ExecutionGate;
  rationale: string;
  wallet?: string;
  chainId?: number;
  agentTokenId?: string;
}): TradeMemoryRecord {
  const { proposal, consensus, gate, rationale, sessionId } = args;
  return {
    schemaVersion: TRADE_MEMORY_SCHEMA,
    type: "concierge.trade.memory",
    sessionId,
    proposalId: proposal.id,
    agentTokenId: args.agentTokenId ?? proposal.agentTokenId,
    wallet: args.wallet,
    chainId: args.chainId,
    pair: proposal.pair,
    side: proposal.side,
    size: proposal.size,
    sizeIsQuote: proposal.sizeIsQuote,
    confidence: consensus.confidence,
    agreement: consensus.agreement,
    gate,
    rationale,
    votes: consensus.votes,
    guardSealHash: proposal.guardSealHash,
    createdAt: new Date().toISOString(),
  };
}

export function parseTradeMemoryRecord(raw: string): TradeMemoryRecord | null {
  try {
    const parsed = JSON.parse(raw) as TradeMemoryRecord;
    if (
      parsed?.type === "concierge.trade.memory" &&
      parsed.schemaVersion === TRADE_MEMORY_SCHEMA &&
      parsed.sessionId &&
      parsed.proposalId
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** JSON blob ready for 0G Storage upload (server-side). */
export function serializeTradeMemory(record: TradeMemoryRecord): string {
  return JSON.stringify(record, null, 2);
}

/** Browser File for vault upload. */
export function tradeMemoryToFile(record: TradeMemoryRecord): File {
  const name = `trade-memory-${record.proposalId}.json`;
  return new File([serializeTradeMemory(record)], name, {
    type: "application/json",
  });
}

/** Vault evidence pack summarizing an orchestrated trade decision. */
export function tradeMemoryEvidence(record: TradeMemoryRecord): VaultEvidence {
  return {
    schemaVersion: 1,
    id: createEvidenceId("trade"),
    type: "trade",
    source: "wallet",
    title: `Agent ${record.side.to ()} ${record.pair}`,
    summary: `${record.gate}: ${record.side} ${record.size} — ${Math.round(record.confidence * 100)}% confidence`,
    facts: [
      { key: "memory_type", value: record.type },
      { key: "session_id", value: record.sessionId },
      { key: "proposal_id", value: record.proposalId },
      { key: "pair", value: record.pair },
      { key: "side", value: record.side },
      { key: "size", value: record.size },
      { key: "size_is_quote", value: record.sizeIsQuote },
      { key: "gate", value: record.gate },
      { key: "confidence", value: record.confidence },
      { key: "agreement", value: record.agreement },
      ...(record.agentTokenId
        ? [{ key: "agent_token_id", value: record.agentTokenId }]
        : []),
      ...(record.guardSealHash
        ? [{ key: "guard_seal", value: record.guardSealHash }]
        : []),
    ],
    wallet: record.wallet,
    chainId: record.chainId,
    createdAt: record.createdAt,
    confidence: record.confidence,
    rawExcerpt: serializeTradeMemory(record).slice(0, 2000),
  };
}

export function gateLabel(gate: ExecutionGate): string {
  switch (gate) {
    case "AUTO_EXECUTE":
      return "Auto-eligible";
    case "NEEDS_APPROVAL":
      return "Needs confirmation";
    case "BLOCKED":
      return "Blocked";
  }
}
