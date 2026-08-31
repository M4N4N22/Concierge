import { parseUnits } from "viem";
import type { TradeProposal, TradeQuote } from "./types";
import { createEvidenceId, type VaultEvidence } from "@/lib/evidence";

export function minOutRaw(quote: TradeQuote, outDecimals: number): bigint {
  try {
    return parseUnits(quote.amountOutMinimum, outDecimals);
  } catch {
    return 0n;
  }
}

/** Persistable vault pack for a confirmed / executed trade. */
export function tradeExecutionEvidence(args: {
  proposal: TradeProposal;
  quote: TradeQuote;
  wallet?: string;
  txHash?: string;
  approveTxHash?: string;
  mode: "live" | "simulated";
  status: "executed" | "failed" | "confirmed";
  error?: string;
}): VaultEvidence {
  const { proposal, quote, wallet, txHash, approveTxHash, mode, status, error } =
    args;
  return {
    schemaVersion: 1,
    id: createEvidenceId("trade"),
    type: "trade",
    source: "wallet",
    title: `Trade ${proposal.side.toUpperCase()} ${proposal.pair}`,
    summary: `${status} (${mode}): ${quote.amountIn} ${quote.tokenInSymbol} → ~${quote.amountOut} ${quote.tokenOutSymbol}`,
    facts: [
      { key: "proposal_id", value: proposal.id },
      { key: "board_session", value: proposal.boardSessionId },
      { key: "pair", value: proposal.pair },
      { key: "side", value: proposal.side },
      { key: "status", value: status },
      { key: "quote_mode", value: mode },
      { key: "amount_in", value: quote.amountIn, unit: quote.tokenInSymbol },
      { key: "amount_out", value: quote.amountOut, unit: quote.tokenOutSymbol },
      { key: "min_out", value: quote.amountOutMinimum, unit: quote.tokenOutSymbol },
      { key: "slippage_bps", value: quote.maxSlippageBps },
      ...(txHash ? [{ key: "tx_hash", value: txHash }] : []),
      ...(approveTxHash ? [{ key: "approve_tx", value: approveTxHash }] : []),
      ...(proposal.guardSealHash
        ? [{ key: "guard_seal", value: proposal.guardSealHash }]
        : []),
      ...(error ? [{ key: "error", value: error }] : []),
    ],
    wallet,
    chainId: quote.chainId,
    createdAt: new Date().toISOString(),
    confidence: mode === "live" && status === "executed" ? 0.95 : 0.6,
    rawExcerpt: JSON.stringify({ proposal, quote }, null, 2).slice(0, 2000),
  };
}
