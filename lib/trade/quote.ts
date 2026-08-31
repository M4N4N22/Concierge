import { parseUnits, formatUnits } from "viem";
import type { PublicClient } from "viem";
import {
  getDexConfig,
  pathForExactOutput,
  pathForPair,
  QUOTER_V2_ABI,
  type DexConfig,
} from "./dex";
import { isLiveRoutablePair, normalizeTradePair } from "./pairs";
import type { TradeProposal, TradeQuote } from "./types";

/** Demo rate when Quoter has no liquidity / testnet unset: 1 OG ≈ 0.10 USDC */
const SIM_OG_PER_USDC = 10;

function amountInRawBuyOrBaseSell(
  proposal: TradeProposal,
  config: DexConfig,
  side: "buy" | "sell"
): bigint {
  if (side === "buy") {
    return parseUnits(String(proposal.size), config.usdc.decimals);
  }
  // Base-denominated sell only — quote-notional sells use live exact-output.
  return parseUnits(String(proposal.size), config.wNative.decimals);
}

function applySlippage(amountOut: bigint, bps: number): bigint {
  return (amountOut * BigInt(10_000 - bps)) / 10_000n;
}

function simulatedQuote(
  proposal: TradeProposal,
  chainId: number,
  reason: string
): TradeQuote {
  const side = proposal.side === "sell" ? "sell" : "buy";
  const pair = normalizeTradePair(proposal.pair);
  let amountIn: number;
  let amountOut: number;
  let tokenInSymbol: string;
  let tokenOutSymbol: string;

  if (side === "buy") {
    amountIn = proposal.size;
    amountOut = proposal.size * SIM_OG_PER_USDC;
    tokenInSymbol = "USDC";
    tokenOutSymbol = "W0G";
  } else {
    if (proposal.sizeIsQuote) {
      amountOut = proposal.size;
      amountIn = proposal.size * SIM_OG_PER_USDC;
    } else {
      amountIn = proposal.size;
      amountOut = proposal.size / SIM_OG_PER_USDC;
    }
    tokenInSymbol = "W0G";
    tokenOutSymbol = "USDC";
  }

  const minOut = amountOut * (1 - proposal.maxSlippageBps / 10_000);

  return {
    mode: "simulated",
    chainId,
    pair,
    side,
    tokenInSymbol,
    tokenOutSymbol,
    amountIn: amountIn.toFixed(6),
    amountOut: amountOut.toFixed(6),
    amountInRaw: String(Math.floor(amountIn * 1e6)),
    amountOutRaw: String(Math.floor(amountOut * 1e6)),
    amountOutMinimum: minOut.toFixed(6),
    maxSlippageBps: proposal.maxSlippageBps,
    fetchedAt: new Date().toISOString(),
    note: reason,
  };
}

async function liveQuote(
  publicClient: PublicClient,
  config: DexConfig,
  proposal: TradeProposal
): Promise<TradeQuote> {
  const side = proposal.side === "sell" ? "sell" : "buy";
  const pair = normalizeTradePair(proposal.pair);
  if (!isLiveRoutablePair(pair)) {
    throw new Error(`No live route for ${pair}`);
  }

  const { path, tokenIn, tokenOut } = pathForPair(config, side, pair);

  let amountIn: bigint;
  let amountOut: bigint;
  let execPath = path;
  let note = "Uniswap V3 multi-hop via WETH (W0G ↔ WETH ↔ USDC.e)";

  if (side === "sell" && proposal.sizeIsQuote) {
    // Quote-notional sell: size is USDC out — size W0G in from live exact-output.
    const amountOutDesired = parseUnits(
      String(proposal.size),
      config.usdc.decimals
    );
    const outPath = pathForExactOutput(config, side, pair);
    const { result } = await publicClient.simulateContract({
      address: config.quoterV2,
      abi: QUOTER_V2_ABI,
      functionName: "quoteExactOutput",
      args: [outPath, amountOutDesired],
    });
    amountIn = result[0] as bigint;
    amountOut = amountOutDesired;
    execPath = path;
    note =
      "Live exact-output sized sell (USDC notional → W0G in), then exactInput exec";
  } else {
    amountIn = amountInRawBuyOrBaseSell(proposal, config, side);
    const { result } = await publicClient.simulateContract({
      address: config.quoterV2,
      abi: QUOTER_V2_ABI,
      functionName: "quoteExactInput",
      args: [path, amountIn],
    });
    amountOut = result[0] as bigint;
  }

  const minOut = applySlippage(amountOut, proposal.maxSlippageBps);

  return {
    mode: "live",
    chainId: config.chainId,
    pair,
    side,
    tokenInSymbol: tokenIn.symbol,
    tokenOutSymbol: tokenOut.symbol,
    amountIn: formatUnits(amountIn, tokenIn.decimals),
    amountOut: formatUnits(amountOut, tokenOut.decimals),
    amountInRaw: amountIn.toString(),
    amountOutRaw: amountOut.toString(),
    amountOutMinimum: formatUnits(minOut, tokenOut.decimals),
    maxSlippageBps: proposal.maxSlippageBps,
    path: execPath,
    router: config.swapRouter02,
    fetchedAt: new Date().toISOString(),
    note,
  };
}

/**
 * Quote a board proposal on Uniswap V3 when available; otherwise simulated.
 * Never executes — human confirm required separately.
 * Live routes only for OG/USDC; unsupported pairs stay simulated (not executable live).
 */
export async function quoteTradeProposal(
  publicClient: PublicClient | null,
  chainId: number,
  proposal: TradeProposal
): Promise<TradeQuote> {
  if (proposal.side === "hold") {
    return simulatedQuote(proposal, chainId, "Hold — no swap path");
  }

  const pair = normalizeTradePair(proposal.pair);
  if (!isLiveRoutablePair(pair)) {
    return simulatedQuote(
      proposal,
      chainId,
      `Unsupported pair ${pair} for live DEX (only OG/USDC). Simulated only — execution disabled.`
    );
  }

  const config = getDexConfig(chainId);
  if (!config || !publicClient) {
    return simulatedQuote(
      proposal,
      chainId,
      chainId === 16602
        ? "Galileo: Uniswap not configured — simulated quote (set NEXT_PUBLIC_*_TESTNET to go live)"
        : "DEX unavailable — simulated quote"
    );
  }

  try {
    return await liveQuote(publicClient, config, proposal);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "quote failed";
    // Never fall back to sim-rate sized sells as "almost live" — keep preview only.
    const sellNotionalNote =
      proposal.side === "sell" && proposal.sizeIsQuote
        ? ` Live sell notional needs an exact-output quote — simulated preview only (not executable at this size).`
        : "";
    return simulatedQuote(
      proposal,
      chainId,
      `Live quote failed (${msg.slice(0, 80)}) — pools may lack liquidity. Simulated fallback.${sellNotionalNote}`
    );
  }
}
