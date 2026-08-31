import { parseUnits, formatUnits } from "viem";
import type { PublicClient } from "viem";
import {
  getDexConfig,
  pathForPair,
  QUOTER_V2_ABI,
  type DexConfig,
} from "./dex";
import type { TradeProposal, TradeQuote } from "./types";

/** Demo rate when Quoter has no liquidity / testnet unset: 1 OG ≈ 0.10 USDC */
const SIM_OG_PER_USDC = 10;

function amountInRaw(
  proposal: TradeProposal,
  config: DexConfig,
  side: "buy" | "sell"
): bigint {
  if (side === "buy") {
    // size is quote (USDC)
    return parseUnits(String(proposal.size), config.usdc.decimals);
  }
  if (proposal.sizeIsQuote) {
    // sell notional in USDC → approximate OG in at sim/live after quote;
    // for amountIn we spend OG: convert USDC notional → OG via sim rate first,
    // live path will re-quote. Use OG amount ≈ size * SIM_OG_PER_USDC.
    const og = proposal.size * SIM_OG_PER_USDC;
    return parseUnits(og.toFixed(6), config.wNative.decimals);
  }
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

  const minOut =
    amountOut * (1 - proposal.maxSlippageBps / 10_000);

  return {
    mode: "simulated",
    chainId,
    pair: proposal.pair,
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
  const { path, tokenIn, tokenOut } = pathForPair(config, side);
  const amountIn = amountInRaw(proposal, config, side);

  const { result } = await publicClient.simulateContract({
    address: config.quoterV2,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInput",
    args: [path, amountIn],
  });

  const amountOut = result[0] as bigint;
  const minOut = applySlippage(amountOut, proposal.maxSlippageBps);

  return {
    mode: "live",
    chainId: config.chainId,
    pair: proposal.pair,
    side,
    tokenInSymbol: tokenIn.symbol,
    tokenOutSymbol: tokenOut.symbol,
    amountIn: formatUnits(amountIn, tokenIn.decimals),
    amountOut: formatUnits(amountOut, tokenOut.decimals),
    amountInRaw: amountIn.toString(),
    amountOutRaw: amountOut.toString(),
    amountOutMinimum: formatUnits(minOut, tokenOut.decimals),
    maxSlippageBps: proposal.maxSlippageBps,
    path,
    router: config.swapRouter02,
    fetchedAt: new Date().toISOString(),
    note: "Uniswap V3 multi-hop via WETH (W0G ↔ WETH ↔ USDC.e)",
  };
}

/**
 * Quote a board proposal on Uniswap V3 when available; otherwise simulated.
 * Never executes — human confirm required separately.
 */
export async function quoteTradeProposal(
  publicClient: PublicClient | null,
  chainId: number,
  proposal: TradeProposal
): Promise<TradeQuote> {
  if (proposal.side === "hold") {
    return simulatedQuote(proposal, chainId, "Hold — no swap path");
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
    return simulatedQuote(
      proposal,
      chainId,
      `Live quote failed (${msg.slice(0, 80)}) — pools may lack liquidity. Simulated fallback.`
    );
  }
}
