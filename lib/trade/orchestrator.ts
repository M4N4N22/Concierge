/**
 * Multi-agent trade orchestration — inspired by ETH Cannes 0G winners:
 * - Shawarma Orchestrate: weighted agent consensus → confidence → action gate
 * - Orchestra: Planner output + Gatekeeper (AUTO_EXECUTE | NEEDS_APPROVAL | BLOCKED)
 * - Croisette.cc / NerOS: persist decision memory on 0G Storage for audit + Agentic ID
 */

import type { BoardSession } from "@/lib/board";
import type { GuardStatus } from "@/lib/board/types";
import { mandateWithinLimits } from "./propose";
import type { TradeSuggestion } from "./suggest";
import type { TradeMandate, TradeProposal, TradeSide } from "./types";

export type ExecutionGate = "AUTO_EXECUTE" | "NEEDS_APPROVAL" | "BLOCKED";

export type AgentVote = {
  name: string;
  side: TradeSide;
  weight: number;
  confidence: number;
  note: string;
};

export type TradeConsensus = {
  side: TradeSide;
  confidence: number;
  /** Weighted agreement on the winning side (0–1). */
  agreement: number;
  votes: AgentVote[];
  threshold: number;
  meetsThreshold: boolean;
};

export type TradeOrchestrationResult = {
  consensus: TradeConsensus;
  gate: ExecutionGate;
  reasons: string[];
  proposal: TradeProposal;
  suggestion: TradeSuggestion;
  sessionId: string;
  computeMode: string;
  guardStatus?: GuardStatus;
};

export const DEFAULT_CONSENSUS_THRESHOLD = 0.65;

const AGENT_WEIGHTS: Record<string, number> = {
  Analyst: 0.35,
  Risk: 0.4,
  Trader: 0.25,
};

function normalizeSide(raw: string): TradeSide {
  const s = raw.toLowerCase();
  if (s === "buy" || s === "sell" || s === "hold") return s;
  if (s === "long" || s === "accumulate") return "buy";
  if (s === "short" || s === "trim" || s === "cap") return "sell";
  return "hold";
}

export function buildAgentVotes(suggestion: TradeSuggestion): AgentVote[] {
  return suggestion.agents.map((a) => ({
    name: a.name,
    side: normalizeSide(a.stance),
    weight: AGENT_WEIGHTS[a.name] ?? 0.2,
    confidence: suggestion.confidence,
    note: a.note,
  }));
}

/**
 * Weighted voting across specialist agents (Shawarma-style consensus layer).
 */
export function evaluateConsensus(
  votes: AgentVote[],
  targetSide: TradeSide,
  threshold = DEFAULT_CONSENSUS_THRESHOLD
): TradeConsensus {
  if (!votes.length) {
    return {
      side: targetSide,
      confidence: 0,
      agreement: 0,
      votes: [],
      threshold,
      meetsThreshold: false,
    };
  }

  const totals: Record<TradeSide, number> = { buy: 0, sell: 0, hold: 0 };
  let weightSum = 0;
  let confidenceSum = 0;

  for (const v of votes) {
    const w = v.weight * v.confidence;
    totals[v.side] += w;
    weightSum += v.weight;
    confidenceSum += v.confidence * v.weight;
  }

  const entries = (Object.entries(totals) as [TradeSide, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const winningSide = entries[0]?.[0] ?? targetSide;
  const winningWeight = entries[0]?.[1] ?? 0;
  const agreement = weightSum > 0 ? winningWeight / weightSum : 0;
  const confidence = weightSum > 0 ? confidenceSum / weightSum : 0;

  return {
    side: winningSide,
    confidence,
    agreement,
    votes,
    threshold,
    meetsThreshold: agreement >= threshold && winningSide === targetSide,
  };
}

/**
 * Gatekeeper: mandate + firewall + consensus must align before execution.
 * Mirrors Orchestra's AUTO_EXECUTE / NEEDS_APPROVAL / BLOCKED flow.
 */
export function resolveExecutionGate(args: {
  consensus: TradeConsensus;
  proposal: TradeProposal;
  mandate: TradeMandate;
  guardStatus?: GuardStatus;
}): { gate: ExecutionGate; reasons: string[] } {
  const { consensus, proposal, mandate, guardStatus } = args;
  const reasons: string[] = [];

  if (guardStatus === "block" || proposal.status === "blocked") {
    reasons.push("Agentic firewall blocked this action");
    return { gate: "BLOCKED", reasons };
  }

  if (proposal.side === "hold") {
    reasons.push("Agents recommend hold — no trade ticket");
    return { gate: "BLOCKED", reasons };
  }

  const limits = mandateWithinLimits(proposal, mandate);
  if (!limits.ok) {
    reasons.push(...limits.reasons);
    return { gate: "BLOCKED", reasons };
  }

  if (!consensus.meetsThreshold) {
    reasons.push(
      `Agent agreement ${Math.round(consensus.agreement * 100)}% below ${Math.round(consensus.threshold * 100)}% threshold`
    );
    return { gate: "NEEDS_APPROVAL", reasons };
  }

  if (guardStatus === "review" || mandate.requireConfirm || !mandate.autonomous) {
    if (guardStatus === "review") reasons.push("Firewall flagged for human review");
    if (mandate.requireConfirm) reasons.push("Mandate requires explicit confirmation");
    if (!mandate.autonomous) reasons.push("Autonomous execution disabled in mandate");
    return { gate: "NEEDS_APPROVAL", reasons };
  }

  reasons.push("Consensus, mandate, and firewall passed — eligible for auto-execute");
  return { gate: "AUTO_EXECUTE", reasons };
}

/** Full orchestration pipeline: suggestion + board session → gate + proposal. */
export function orchestrateTradeDecision(args: {
  session: BoardSession;
  suggestion: TradeSuggestion;
  proposal: TradeProposal;
  mandate: TradeMandate;
  threshold?: number;
}): TradeOrchestrationResult {
  const votes = buildAgentVotes(args.suggestion);
  const consensus = evaluateConsensus(
    votes,
    args.suggestion.side,
    args.threshold ?? DEFAULT_CONSENSUS_THRESHOLD
  );
  const { gate, reasons } = resolveExecutionGate({
    consensus,
    proposal: args.proposal,
    mandate: args.mandate,
    guardStatus: args.session.guard?.status,
  });

  return {
    consensus,
    gate,
    reasons,
    proposal: args.proposal,
    suggestion: args.suggestion,
    sessionId: args.session.id,
    computeMode: args.session.computeMode,
    guardStatus: args.session.guard?.status,
  };
}
