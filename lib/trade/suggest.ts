import type { TradeMandate } from "./types";

export const TRADE_SUGGEST_QUESTION =
  "Given these wallet balances and policy, recommend buy OG with USDC, sell OG for USDC, or hold. Include a concrete size under max notional. Prefer hold when unclear.";

export type TradeSuggestion = {
  side: "buy" | "sell" | "hold";
  /** Buy: USDC to spend. Sell: OG to sell (base). Hold: 0 */
  size: number;
  sizeIsQuote: boolean;
  rationale: string;
  confidence: number;
  source: "agents" | "heuristic";
  agents: Array<{ name: string; stance: string; note: string }>;
};

export type BalanceSnapshot = {
  og: number;
  usdc: number;
  weth: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function roundSize(n: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function tradeAgents(
  side: TradeSuggestion["side"],
  size: number,
  sizeIsQuote: boolean
): TradeSuggestion["agents"] {
  const unit = sizeIsQuote ? "USDC" : "OG";
  const sizeLabel = side === "hold" ? "flat" : `${size} ${unit}`;
  return [
    {
      name: "Analyst",
      stance: side,
      note:
        side === "hold"
          ? "Wallet mix does not justify a spot move right now."
          : `Favors ${side} OG sized at ${sizeLabel}.`,
    },
    {
      name: "Risk",
      stance: side === "hold" ? "hold" : "cap",
      note: "Keeps size inside max notional and funded balance.",
    },
    {
      name: "Trader",
      stance: side,
      note:
        side === "hold"
          ? "No ticket — wait for clearer inventory vs cash."
          : `Ready to draft a ${side.to ()} ticket if you apply.`,
    },
  ];
}

/** Deterministic desk suggestion from balances + mandate — always available. */
export function heuristicTradeSuggest(
  balances: BalanceSnapshot,
  mandate: Pick<TradeMandate, "maxNotional">
): TradeSuggestion {
  const maxN = Math.max(1, mandate.maxNotional);
  const og = Math.max(0, balances.og);
  const usdc = Math.max(0, balances.usdc);

  // Thin USDC, heavy OG → trim
  if (og >= 1 && usdc < Math.max(2, maxN * 0.25) && og > usdc) {
    const size = roundSize(
      clamp(og * 0.15, 0.25, Math.min(og * 0.3, Math.max(og * 0.1, 1))),
      4
    );
    if (size > 0 && size <= og) {
      return {
        side: "sell",
        size,
        sizeIsQuote: false,
        rationale: `OG (${roundSize(og, 4)}) is heavy vs USDC (${roundSize(usdc, 2)}). Trim ${size} OG toward stables under your ${maxN} USDC policy lens.`,
        confidence: 0.66,
        source: "heuristic",
        agents: tradeAgents("sell", size, false),
      };
    }
  }

  // Funded USDC → accumulate
  if (usdc >= 1) {
    const size = roundSize(
      clamp(Math.min(usdc * 0.25, maxN * 0.5, usdc * 0.95), 0.5, maxN),
      2
    );
    if (size >= 0.5 && size <= usdc) {
      return {
        side: "buy",
        size,
        sizeIsQuote: true,
        rationale: `You have ${roundSize(usdc, 2)} USDC spendable. Measured OG buy of ${size} USDC (cap ${maxN}).`,
        confidence: 0.68,
        source: "heuristic",
        agents: tradeAgents("buy", size, true),
      };
    }
  }

  return {
    side: "hold",
    size: 0,
    sizeIsQuote: true,
    rationale: `Balances (OG ${roundSize(og, 4)}, USDC ${roundSize(usdc, 2)}) do not support a clear spot edge — hold.`,
    confidence: 0.6,
    source: "heuristic",
    agents: tradeAgents("hold", 0, true),
  };
}

function isUnusableBoardOutput(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("offline fallback") ||
    lower.includes("strengthen evidence") ||
    lower.includes("vault context") ||
    lower.includes("insufficient evidence") ||
    lower.includes("under-specified") ||
    (lower.includes("verdict is revise") && !/\bsize\b/i.test(text))
  );
}

function actionableSuggestion(s: TradeSuggestion): boolean {
  if (s.side === "hold") return true;
  return s.size > 0;
}

/**
 * Parse live agent output into a desk suggestion.
 * Never trusts vault-board fallback prose — returns heuristic instead.
 */
export function suggestionFromBoardText(
  text: string,
  balances: BalanceSnapshot,
  mandate: Pick<TradeMandate, "maxNotional">,
  agentTurns?: Array<{ name: string; stance: string; argument: string }>,
  opts?: { computeMode?: string }
): TradeSuggestion {
  const base = heuristicTradeSuggest(balances, mandate);

  if (opts?.computeMode === "fallback" || isUnusableBoardOutput(text)) {
    return {
      ...base,
      source: "heuristic",
      rationale: `${base.rationale} (Agents offline — used wallet heuristic.)`,
    };
  }

  // Strip the prompt itself so "buy OG… sell OG… or hold" in the question
  // cannot force a side.
  const scrubbed = text.replaceAll(TRADE_SUGGEST_QUESTION, " ").toLowerCase();

  let side: TradeSuggestion["side"] = base.side;
  const buyHit = (scrubbed.match(/\bbuy\b|\baccumulate\b|\blong\b/g) || [])
    .length;
  const sellHit = (scrubbed.match(/\bsell\b|\btrim\b|\breduce\b/g) || [])
    .length;
  const holdHit = (scrubbed.match(/\bhold\b|\bwait\b|\bflat\b/g) || []).length;

  if (holdHit > buyHit && holdHit > sellHit) side = "hold";
  else if (sellHit > buyHit) side = "sell";
  else if (buyHit > sellHit) side = "buy";

  const sizeMatch = scrubbed.match(
    /(?:size|amount|notional|spend)\s*[:=]?\s*\$?\s*(\d+(?:\.\d+)?)/i
  );
  let size = base.size;
  let sizeIsQuote = side === "buy";

  if (sizeMatch) {
    size = Number(sizeMatch[1]);
    if (side === "buy") {
      size = Math.min(size, mandate.maxNotional, Math.max(0, balances.usdc * 0.95));
      sizeIsQuote = true;
    } else if (side === "sell") {
      size = Math.min(size, Math.max(0, balances.og * 0.95));
      sizeIsQuote = false;
    }
  } else if (side !== base.side) {
    // Side changed from heuristic but no size in text — keep heuristic size if same family, else rebuild.
    const rebuilt = heuristicTradeSuggest(balances, mandate);
    if (rebuilt.side === side) {
      size = rebuilt.size;
      sizeIsQuote = rebuilt.sizeIsQuote;
    } else if (side === "buy" && balances.usdc >= 0.5) {
      size = roundSize(
        clamp(Math.min(balances.usdc * 0.25, mandate.maxNotional * 0.5), 0.5, mandate.maxNotional),
        2
      );
      sizeIsQuote = true;
    } else if (side === "sell" && balances.og >= 0.25) {
      size = roundSize(clamp(balances.og * 0.15, 0.25, balances.og * 0.3), 4);
      sizeIsQuote = false;
    } else {
      side = "hold";
      size = 0;
    }
  }

  if (side === "hold") size = 0;

  const parsed: TradeSuggestion = {
    side,
    size: side === "buy" ? roundSize(size, 2) : roundSize(size, 4),
    sizeIsQuote,
    rationale: text
      .replaceAll(TRADE_SUGGEST_QUESTION, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280) || base.rationale,
    confidence: clamp(side === base.side ? 0.74 : 0.6, 0.4, 0.9),
    source: "agents",
    agents:
      agentTurns?.slice(0, 3).map((t) => ({
        name: t.name.replace(/ agent$/i, ""),
        stance: t.stance,
        note: t.argument.slice(0, 110),
      })) ?? tradeAgents(side, size, sizeIsQuote),
  };

  if (!actionableSuggestion(parsed)) {
    return {
      ...base,
      source: "heuristic",
      rationale: `${base.rationale} (Agent text had no actionable size — used wallet heuristic.)`,
    };
  }

  // Prefer crisp heuristic rationale when agent prose is still board-generic
  if (isUnusableBoardOutput(parsed.rationale)) {
    return {
      ...parsed,
      rationale: base.rationale,
      agents: tradeAgents(parsed.side, parsed.size, parsed.sizeIsQuote),
      source: "agents",
    };
  }

  return {
    ...parsed,
    agents: tradeAgents(parsed.side, parsed.size, parsed.sizeIsQuote).map(
      (a, i) =>
        parsed.agents[i]
          ? { ...a, note: parsed.agents[i].note || a.note }
          : a
    ),
  };
}
