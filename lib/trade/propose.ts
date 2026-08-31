import type { BoardSession } from "@/lib/board";
import {
  createTradeId,
  type TradeMandate,
  type TradeProposal,
  type TradeSide,
} from "./types";

const PAIR_RE = /\b([A-Z]{2,10})\s*\/\s*([A-Z]{2,10})\b/;
const BUY_RE = /\b(buy|long|accumulate)\b/i;
const SELL_RE = /\b(sell|short|exit|take\s*profit)\b/i;
const SIZE_RE =
  /(?:size|amount|notional|spend)\s*[:=]?\s*\$?\s*(\d+(?:\.\d+)?)/i;

function inferSide(text: string): TradeSide {
  if (SELL_RE.test(text) && !BUY_RE.test(text)) return "sell";
  if (BUY_RE.test(text)) return "buy";
  return "hold";
}

function inferPair(text: string): string {
  const m = text.match(PAIR_RE);
  if (m) return `${m[1]}/${m[2]}`;
  if (/\bog\b/i.test(text)) return "OG/USDC";
  return "OG/USDC";
}

function inferSize(text: string, mandate: TradeMandate): number {
  const m = text.match(SIZE_RE);
  if (m) {
    const n = Number(m[1]);
    if (!Number.isNaN(n) && n > 0) return Math.min(n, mandate.maxNotional);
  }
  return Math.min(10, mandate.maxNotional);
}

/**
 * Build a trade proposal from a sealed board session.
 * Does NOT execute — status is proposed / blocked / awaiting_confirm.
 */
export function proposeTradeFromBoard(
  session: BoardSession,
  mandate: TradeMandate
): TradeProposal {
  const corpus = [
    session.question,
    session.consensus.summary,
    ...session.consensus.actions,
  ].join("\n");

  const side = inferSide(corpus);
  const pair = inferPair(corpus);
  const size = inferSize(corpus, mandate);
  const citations = [
    ...session.evidenceIds.slice(0, 4),
    ...session.turns.flatMap((t) => t.citations).slice(0, 4),
  ];

  let status: TradeProposal["status"] = "proposed";
  if (session.guard?.status === "block" || side === "hold") {
    status = "blocked";
  } else if (
    mandate.requireConfirm ||
    !mandate.autonomous ||
    session.guard?.status === "review"
  ) {
    status = "awaiting_confirm";
  }

  if (mandate.allowlist.length && !mandate.allowlist.includes(pair)) {
    status = "blocked";
  }
  if (size > mandate.maxNotional) {
    status = "blocked";
  }

  return {
    schemaVersion: 1,
    id: createTradeId(),
    boardSessionId: session.id,
    agentTokenId: session.agentTokenId,
    pair,
    side,
    size,
    sizeIsQuote: true,
    maxSlippageBps: mandate.maxSlippageBps,
    rationale:
      side === "hold"
        ? "Board did not recommend a market action."
        : session.consensus.summary.slice(0, 280),
    citations: [...new Set(citations)].slice(0, 8),
    status,
    guardSealHash: session.guard?.sealHash,
    createdAt: new Date().toISOString(),
  };
}

export function mandateWithinLimits(
  proposal: TradeProposal,
  mandate: TradeMandate
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (proposal.size > mandate.maxNotional) {
    reasons.push(`Size exceeds max notional (${mandate.maxNotional})`);
  }
  if (proposal.maxSlippageBps > mandate.maxSlippageBps) {
    reasons.push(`Slippage exceeds mandate (${mandate.maxSlippageBps} bps)`);
  }
  if (mandate.allowlist.length && !mandate.allowlist.includes(proposal.pair)) {
    reasons.push(`Pair ${proposal.pair} not on allowlist`);
  }
  if (proposal.status === "blocked") {
    reasons.push("Proposal blocked by firewall or policy");
  }
  return { ok: reasons.length === 0, reasons };
}
