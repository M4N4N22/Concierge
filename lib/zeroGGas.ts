import type { PublicClient } from "viem";
import { ethers } from "ethers";

/** 0G Mainnet RPC rejects tips below this (error 0x4115). Use a small buffer above 2 gwei. */
export const OG_MIN_PRIORITY_FEE_WEI = 2_500_000_000n; // 2.5 gwei
/** Safe legacy gasPrice floor when SDK only accepts gasPrice. */
export const OG_MIN_GAS_PRICE_WEI = 6_000_000_000n; // 6 gwei

export function isZeroGMainnet(chainId: number | undefined): boolean {
  return chainId === 16661;
}

/** EIP-1559 overrides for wallet txs (vault, marketplace, agent). */
export async function zeroGFeeOverrides(
  publicClient: PublicClient | undefined,
  chainId: number | undefined
): Promise<{
  maxPriorityFeePerGas?: bigint;
  maxFeePerGas?: bigint;
} | undefined> {
  if (!isZeroGMainnet(chainId)) return undefined;

  let tip = OG_MIN_PRIORITY_FEE_WEI;
  let maxFee = OG_MIN_GAS_PRICE_WEI;

  try {
    const fees = await publicClient?.estimateFeesPerGas();
    if (fees?.maxPriorityFeePerGas && fees.maxPriorityFeePerGas > tip) {
      tip = fees.maxPriorityFeePerGas;
    }
    if (fees?.maxFeePerGas && fees.maxFeePerGas > maxFee) {
      maxFee = fees.maxFeePerGas;
    }
  } catch {
    /* use floors */
  }

  if (maxFee < tip * 2n) maxFee = tip * 2n;

  return { maxPriorityFeePerGas: tip, maxFeePerGas: maxFee };
}

/** Legacy gasPrice for 0G Storage SDK TransactionOptions. */
export async function zeroGStorageGasPrice(
  provider: ethers.Provider,
  chainId: number
): Promise<bigint | undefined> {
  if (!isZeroGMainnet(chainId)) return undefined;

  try {
    const fee = await provider.getFeeData();
    const candidates = [
      fee.gasPrice ?? 0n,
      fee.maxFeePerGas ?? 0n,
      (fee.maxPriorityFeePerGas ?? 0n) + (fee.maxFeePerGas ?? OG_MIN_GAS_PRICE_WEI) / 2n,
      OG_MIN_GAS_PRICE_WEI,
    ];
    let best = OG_MIN_GAS_PRICE_WEI;
    for (const c of candidates) {
      if (c > best) best = c;
    }
    // Ensure tip floor even if network suggests lower
    if (best < OG_MIN_PRIORITY_FEE_WEI) best = OG_MIN_GAS_PRICE_WEI;
    return best;
  } catch {
    return OG_MIN_GAS_PRICE_WEI;
  }
}
