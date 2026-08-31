/** Uniswap V3 addresses on 0G Mainnet. Galileo has no public deploy — use env overrides or simulation. */

import { isLiveRoutablePair, normalizeTradePair } from "./pairs";

export type DexToken = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
};

export type DexConfig = {
  chainId: number;
  swapRouter02: `0x${string}`;
  quoterV2: `0x${string}`;
  wNative: DexToken;
  usdc: DexToken;
  weth: DexToken;
  /** fee tiers used in multi-hop OG ↔ USDC via WETH */
  feeNativeWeth: number;
  feeUsdcWeth: number;
};

const MAINNET: DexConfig = {
  chainId: 16661,
  swapRouter02: "0xB8d13405F16E76638404c1d758A090271A88e4e2",
  quoterV2: "0x5EeBF0959012274dA149AdC64Cf37a43f264c330",
  wNative: {
    symbol: "W0G",
    address: "0x1cd0690ff9a693f5ef2dd976660a8dafc81a109c",
    decimals: 18,
  },
  usdc: {
    symbol: "USDC",
    address: "0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E",
    decimals: 6,
  },
  weth: {
    symbol: "WETH",
    address: "0x564770837ef8bbf077cfe54e5f6106538c815b22",
    decimals: 18,
  },
  feeNativeWeth: 3000,
  feeUsdcWeth: 500,
};

function envAddr(key: string): `0x${string}` | undefined {
  const v = process.env[key];
  if (!v || !/^0x[a-fA-F0-9]{40}$/.test(v)) return undefined;
  return v as `0x${string}`;
}

/** Resolve DEX config for chain. Returns null when Uniswap is not configured. */
export function getDexConfig(chainId: number): DexConfig | null {
  if (chainId === 16661) {
    return {
      ...MAINNET,
      swapRouter02: envAddr("NEXT_PUBLIC_SWAP_ROUTER") ?? MAINNET.swapRouter02,
      quoterV2: envAddr("NEXT_PUBLIC_QUOTER_V2") ?? MAINNET.quoterV2,
    };
  }
  if (chainId === 16602) {
    const router = envAddr("NEXT_PUBLIC_SWAP_ROUTER_TESTNET") ?? envAddr("NEXT_PUBLIC_SWAP_ROUTER");
    const quoter = envAddr("NEXT_PUBLIC_QUOTER_V2_TESTNET") ?? envAddr("NEXT_PUBLIC_QUOTER_V2");
    const wNative = envAddr("NEXT_PUBLIC_W0G_TESTNET");
    const usdc = envAddr("NEXT_PUBLIC_USDC_TESTNET");
    const weth = envAddr("NEXT_PUBLIC_WETH_TESTNET");
    if (!router || !quoter || !wNative || !usdc || !weth) return null;
    return {
      chainId: 16602,
      swapRouter02: router,
      quoterV2: quoter,
      wNative: { symbol: "W0G", address: wNative, decimals: 18 },
      usdc: { symbol: "USDC", address: usdc, decimals: 6 },
      weth: { symbol: "WETH", address: weth, decimals: 18 },
      feeNativeWeth: 3000,
      feeUsdcWeth: 500,
    };
  }
  return null;
}

/** Encode Uniswap V3 path: token + fee + token (+ fee + token…) */
export function encodeV3Path(
  tokens: `0x${string}`[],
  fees: number[]
): `0x${string}` {
  if (tokens.length < 2 || fees.length !== tokens.length - 1) {
    throw new Error("Invalid V3 path");
  }
  let hex = "0x";
  for (let i = 0; i < fees.length; i++) {
    hex += tokens[i].slice(2).toLowerCase();
    hex += fees[i].toString(16).padStart(6, "0");
  }
  hex += tokens[tokens.length - 1].slice(2).toLowerCase();
  return hex as `0x${string}`;
}

/** OG/USDC multi-hop via WETH (no direct pool on 0G mainnet). */
export function pathForPair(
  config: DexConfig,
  side: "buy" | "sell",
  pair = "OG/USDC"
): { path: `0x${string}`; tokenIn: DexToken; tokenOut: DexToken } {
  if (!isLiveRoutablePair(pair)) {
    throw new Error(
      `No live Uniswap route for ${normalizeTradePair(pair)} — only OG/USDC`
    );
  }
  const { wNative, usdc, weth, feeNativeWeth, feeUsdcWeth } = config;
  if (side === "buy") {
    // USDC → WETH → W0G
    return {
      path: encodeV3Path(
        [usdc.address, weth.address, wNative.address],
        [feeUsdcWeth, feeNativeWeth]
      ),
      tokenIn: usdc,
      tokenOut: wNative,
    };
  }
  // W0G → WETH → USDC
  return {
    path: encodeV3Path(
      [wNative.address, weth.address, usdc.address],
      [feeNativeWeth, feeUsdcWeth]
    ),
    tokenIn: wNative,
    tokenOut: usdc,
  };
}

/**
 * Exact-output path is the reverse encoding of the exact-input path
 * (Uniswap V3: tokenOut first when quoting/swapping exact output).
 */
export function pathForExactOutput(
  config: DexConfig,
  side: "buy" | "sell",
  pair = "OG/USDC"
): `0x${string}` {
  const { path } = pathForPair(
    config,
    side === "buy" ? "sell" : "buy",
    pair
  );
  return path;
}

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

export const WETH9_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "wad", type: "uint256" }],
    outputs: [],
  },
] as const;

export const QUOTER_V2_ABI = [
  {
    type: "function",
    name: "quoteExactInput",
    stateMutability: "nonpayable",
    inputs: [
      { name: "path", type: "bytes" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96AfterList", type: "uint160[]" },
      { name: "initializedTicksCrossedList", type: "uint32[]" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "quoteExactOutput",
    stateMutability: "nonpayable",
    inputs: [
      { name: "path", type: "bytes" },
      { name: "amountOut", type: "uint256" },
    ],
    outputs: [
      { name: "amountIn", type: "uint256" },
      { name: "sqrtPriceX96AfterList", type: "uint160[]" },
      { name: "initializedTicksCrossedList", type: "uint32[]" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

export const SWAP_ROUTER02_ABI = [
  {
    type: "function",
    name: "exactInput",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "path", type: "bytes" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;
