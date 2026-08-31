/** Trade mandate + proposal foundation for sealed board → optional execution. */

export const TRADE_SCHEMA_VERSION = 1 as const;

export type TradeSide = "buy" | "sell" | "hold";

export type TradeStatus =
  | "proposed"
  | "awaiting_confirm"
  | "blocked"
  | "confirmed"
  | "quoting"
  | "quoted"
  | "executing"
  | "executed"
  | "failed"
  | "cancelled";

export type TradeQuoteMode = "live" | "simulated";

export type TradeQuote = {
  mode: TradeQuoteMode;
  chainId: number;
  pair: string;
  side: TradeSide;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: string;
  amountOut: string;
  amountInRaw: string;
  amountOutRaw: string;
  amountOutMinimum: string;
  maxSlippageBps: number;
  path?: `0x${string}`;
  router?: `0x${string}`;
  fetchedAt: string;
  note?: string;
};

export type TradeExecutionResult = {
  mode: TradeQuoteMode;
  txHash?: `0x${string}`;
  approveTxHash?: `0x${string}`;
  wrapTxHash?: `0x${string}`;
  amountOut?: string;
  error?: string;
  executedAt: string;
};

export type TradeMandate = {
  schemaVersion: typeof TRADE_SCHEMA_VERSION;
  /** Max notional per trade in quote units (e.g. OG / USD) */
  maxNotional: number;
  /** Max slippage bps (100 = 1%) */
  maxSlippageBps: number;
  /** Allowed pair symbols, e.g. ["OG/USDC"] — empty = none until set */
  allowlist: string[];
  /** Require human confirm even if firewall passes */
  requireConfirm: boolean;
  /** Auto-execute only when true AND guard pass AND within limits */
  autonomous: boolean;
  updatedAt: string;
};

export type TradeProposal = {
  schemaVersion: typeof TRADE_SCHEMA_VERSION;
  id: string;
  boardSessionId: string;
  agentTokenId?: string;
  pair: string;
  side: TradeSide;
  /** Amount in base asset, or quote notional if sizeIsQuote */
  size: number;
  sizeIsQuote: boolean;
  maxSlippageBps: number;
  rationale: string;
  citations: string[];
  status: TradeStatus;
  guardSealHash?: `0x${string}`;
  createdAt: string;
};

export const DEFAULT_MANDATE: TradeMandate = {
  schemaVersion: TRADE_SCHEMA_VERSION,
  maxNotional: 100,
  maxSlippageBps: 50,
  allowlist: [],
  requireConfirm: true,
  autonomous: false,
  updatedAt: new Date(0).toISOString(),
};

export function createTradeId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `trade_${Date.now()}_${rand}`;
}
