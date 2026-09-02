/** Must match AgentMarketplace DEFAULT_FEE_BPS at deploy time. */
export const MARKETPLACE_FEE_BPS = 250;
export const MARKETPLACE_FEE_LABEL = "2.5%";

export function marketplaceFeeWei(amountWei: bigint): bigint {
  return (amountWei * BigInt(MARKETPLACE_FEE_BPS)) / 10_000n;
}

export function netAfterMarketplaceFee(amountWei: bigint): bigint {
  return amountWei - marketplaceFeeWei(amountWei);
}
